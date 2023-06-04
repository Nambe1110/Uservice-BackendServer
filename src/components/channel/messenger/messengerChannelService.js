import axios from "axios";
import AppError from "../../../utils/AppError.js";
import sequelize from "../../../config/database/index.js";
import MessengerChannelModel from "./messengerChannelModel.js";
import ChannelService from "../channelService.js";
import {
  UserRole,
  ThreadType,
  SenderType,
  ChannelType,
  AttachmentType,
  ChatbotMode,
  NotificationCode,
} from "../../../constants.js";
import logger from "../../../config/logger.js";
import { threadNotifier } from "../../thread/threadNotifier.js";
import ThreadService from "../../thread/threadService.js";
import UserService from "../../user/userService.js";
import CustomerService from "../../customer/customerService.js";
import MessageService from "../../message/messageService.js";
import AttachmentService from "../../attachment/attachmentService.js";
import CompanyService from "../../company/companyService.js";
import SuggestionService from "../../suggestion/suggestionService.js";
import S3 from "../../../modules/S3.js";
import { sendPushNotificationToCompany } from "../../../modules/pushNotification.js";

const pendingMessages = new Map();
const attachmentTypeMapping = {};

attachmentTypeMapping[AttachmentType.IMAGE] = "image";
attachmentTypeMapping[AttachmentType.VIDEO] = "video";
attachmentTypeMapping[AttachmentType.AUDIO] = "audio";
attachmentTypeMapping[AttachmentType.FILE] = "file";
attachmentTypeMapping.image = AttachmentType.IMAGE;
attachmentTypeMapping.video = AttachmentType.VIDEO;
attachmentTypeMapping.audio = AttachmentType.AUDIO;
attachmentTypeMapping.file = AttachmentType.FILE;

export default class MessengerService {
  static async #getPages({ userId, userAccessToken }) {
    try {
      const tokenResponse = await axios.get(
        `${process.env.GRAPH_API_URL}/oauth/access_token`,
        {
          params: {
            grant_type: "fb_exchange_token",
            client_id: process.env.FACEBOOK_APP_ID,
            client_secret: process.env.FACEBOOK_APP_SECRET,
            fb_exchange_token: userAccessToken,
          },
        }
      );

      userAccessToken = tokenResponse.data.access_token;

      const pages = [];
      let after = null;

      while (true) {
        const response = await axios.get(
          `${process.env.GRAPH_API_URL}/${userId}/accounts`,
          {
            params: {
              access_token: userAccessToken,
              after,
            },
          }
        );

        if (response.data.data.length === 0) break;

        response.data.data.forEach((page) => {
          if (page.access_token)
            pages.push({
              pageId: page.id,
              pageName: page.name,
              pageAccessToken: page.access_token,
            });
        });

        if (!response.data.paging.next) break;
        after = response.data.paging.cursors.after;
      }

      return pages;
    } catch (error) {
      if (error.response) {
        logger.error(error.response.data.error.message);
        throw new AppError(
          error.response.data.error.message,
          error.response.status
        );
      } else {
        logger.error(error.message);
        throw new Error(error.message);
      }
    }
  }

  static async #connectPage({ pageId, pageAccessToken, pageName, companyId }) {
    try {
      await axios.post(
        `${process.env.GRAPH_API_URL}/${pageId}/subscribed_apps`,
        {
          subscribed_fields: ["messages", "message_echoes"],
          access_token: pageAccessToken,
        }
      );

      const pictureResponse = await axios.get(
        `${process.env.GRAPH_API_URL}/${pageId}/picture`,
        {
          params: {
            access_token: pageAccessToken,
            redirect: false,
            height: 100,
            width: 100,
          },
        }
      );

      const { url: pagePictureUrl } = pictureResponse.data.data;

      const profileResponse = await axios.get(
        `${process.env.GRAPH_API_URL}/${pageId}`,
        {
          params: {
            fields: "link",
            access_token: pageAccessToken,
          },
        }
      );

      const { link: profile } = profileResponse.data;

      const [newMessengerChannel] = await MessengerChannelModel.findOrCreate({
        where: {
          company_id: companyId,
          page_id: pageId,
        },
        defaults: {
          page_access_token: pageAccessToken,
        },
      });

      const [channel] = await ChannelService.findOrCreate({
        companyId,
        type: ChannelType.MESSENGER,
        channelDetailId: newMessengerChannel.id,
        name: pageName,
        profile,
      });

      if (!channel.image_url && pagePictureUrl) {
        const pictureUrl = await S3.uploadFromUrlToS3({
          url: pagePictureUrl,
          companyId,
        });

        channel.image_url = pictureUrl;
        await channel.save();
      }

      return {
        channel,
        detail: newMessengerChannel,
      };
    } catch (error) {
      if (error.response) {
        logger.error(error.response.data.error.message);
        throw new AppError(
          error.response.data.error.message,
          error.response.status
        );
      } else {
        logger.error(error.message);
        throw new Error(error.message);
      }
    }
  }

  static async connectPages({ userId, userAccessToken, companyId }) {
    try {
      const pages = await this.#getPages({ userId, userAccessToken });
      const connectedPages = await Promise.all(
        pages.map((page) => this.#connectPage({ ...page, companyId }))
      );

      return connectedPages;
    } catch (error) {
      throw new AppError(error.message, error.code ?? 500);
    }
  }

  static async receiveMessage(body) {
    try {
      await Promise.all(
        body.entry.map(async (entry) => {
          const { id: pageId } = entry;

          await Promise.all(
            entry.messaging.map(async (messaging) => {
              const { id: senderId } = messaging.sender;
              const { id: recipientId } = messaging.recipient;
              const { timestamp, message } = messaging;
              const {
                mid: messageApiId,
                text: content,
                reply_to: replyTo,
                attachments = [],
              } = message;
              const threadApiId =
                pageId === recipientId ? senderId : recipientId;
              const customerApiId = threadApiId;

              if (pendingMessages.has(messageApiId)) {
                const {
                  companyId,
                  threadId,
                  senderType,
                  senderId: pendingSenderId,
                  attachment,
                  callback,
                  socket,
                } = pendingMessages.get(messageApiId);

                await this.#messageSendSucceeded({
                  companyId,
                  threadId,
                  messageApiId,
                  senderType,
                  senderId: pendingSenderId,
                  content,
                  timestamp,
                  attachment,
                  callback,
                  socket,
                });

                pendingMessages.delete(messageApiId);
                return;
              }

              const channels = await sequelize.query(
                `SELECT channel.id, channel.company_id, channel.channel_detail_id, messenger_channel.page_access_token
                FROM channel
                JOIN messenger_channel ON channel.channel_detail_id = messenger_channel.id
                WHERE channel.type = :channelType AND messenger_channel.page_id = :pageId`,
                {
                  replacements: {
                    channelType: ChannelType.MESSENGER,
                    pageId,
                  },
                  type: sequelize.QueryTypes.SELECT,
                }
              );

              await Promise.all(
                channels.map(async (channel) => {
                  const { company_id, channel_detail_id, page_access_token } =
                    channel;
                  const company = await CompanyService.getCompanyById(
                    company_id
                  );
                  const [thread] = await ThreadService.getOrCreateThread(
                    {
                      channel_id: channel.id,
                      thread_api_id: threadApiId,
                    },
                    {
                      type: ThreadType.PRIVATE,
                    }
                  );

                  const customerInfo = await axios.get(
                    `${process.env.GRAPH_API_URL}/${customerApiId}`,
                    {
                      params: {
                        fields:
                          "first_name,last_name,middle_name,name,profile_pic",
                        access_token: page_access_token,
                      },
                    }
                  );

                  const {
                    first_name,
                    last_name,
                    middle_name,
                    name,
                    profile_pic,
                  } = customerInfo.data;

                  const [customer] = await CustomerService.getOrCreateCustomer(
                    {
                      thread_id: thread.id,
                      company_id,
                      customer_api_id: customerApiId,
                    },
                    {
                      first_name: last_name,
                      last_name: `${middle_name} ${first_name}`,
                      alias: name,
                      profile: `m.me/${customerApiId}`,
                    }
                  );

                  if (
                    (!thread.image_url || !customer.image_url) &&
                    profile_pic
                  ) {
                    const pictureUrl = await S3.uploadFromUrlToS3({
                      url: profile_pic,
                      companyId: company_id,
                    });

                    if (!thread.image_url) {
                      thread.image_url = pictureUrl;
                      await thread.save();
                    }

                    if (!customer.image_url) {
                      customer.image_url = pictureUrl;
                      await customer.save();
                    }
                  }

                  if (!thread.title) {
                    thread.title = name;
                    await thread.save();
                  }

                  let sender;
                  let senderType;
                  let repliedMessage = null;
                  const attachment = [];

                  if (senderId === pageId) {
                    sender = await UserService.getUser({
                      companyId: company_id,
                      role: UserRole.OWNER,
                    });
                    senderType = SenderType.STAFF;
                  } else {
                    sender = customer;
                    senderType = SenderType.CUSTOMER;
                  }

                  if (replyTo) {
                    repliedMessage = await MessageService.getMessageByApiId({
                      apiId: replyTo.mid,
                      threadId: thread.id,
                    });
                  }

                  const [newMessage] = await MessageService.getOrCreateMessage(
                    {
                      thread_id: thread.id,
                      message_api_id: messageApiId,
                    },
                    {
                      sender_type: senderType,
                      sender_id: sender.id,
                      timestamp,
                      content,
                      replied_message_id: repliedMessage?.id,
                    }
                  );

                  if (attachments.length > 0) {
                    const attachmentDetailResponse = await axios.get(
                      `${process.env.GRAPH_API_URL}/${messageApiId}/attachments`,
                      {
                        params: {
                          access_token: page_access_token,
                        },
                      }
                    );

                    await Promise.all(
                      attachmentDetailResponse.data.data.map(
                        async (attach, index) => {
                          const {
                            type,
                            payload: { url },
                          } = attachments[index];
                          const { name: attachmentName } = attach;

                          const attachmentUrl = await S3.uploadFromUrlToS3({
                            url,
                            companyId: company_id,
                          });

                          const newAttchment =
                            await AttachmentService.createAttachment({
                              messageId: newMessage.id,
                              url: attachmentUrl,
                              type: attachmentTypeMapping[type],
                              name: attachmentName,
                            });

                          attachment.push(newAttchment);
                        }
                      )
                    );
                  }

                  await threadNotifier.onNewMessage({
                    created: true,
                    channelType: ChannelType.MESSENGER,
                    companyId: company_id,
                    thread,
                    customer,
                    message: newMessage,
                    repliedMessage,
                    sender,
                    attachment,
                  });

                  if (senderType === SenderType.CUSTOMER) {
                    if (
                      company.chatbot_mode !== ChatbotMode.AUTO_REPLY ||
                      thread.is_autoreply_disabled
                    ) {
                      thread.is_resolved = false;
                      await thread.save();

                      setTimeout(async () => {
                        try {
                          const lastMessage =
                            await MessageService.getLastMessage({
                              threadId: thread.id,
                            });

                          if (message.id !== lastMessage.id) return;

                          await sendPushNotificationToCompany({
                            companyId: this.companyId,
                            title: `Tin nhắn mới từ ${customer.alias}`,
                            message: content,
                            data: {
                              code: NotificationCode.MESSAGE_FROM_CUSTOMER,
                              data: {
                                thread_id: thread.id,
                              },
                            },
                          });
                        } catch (error) {
                          logger.error(error.message);
                        }
                      }, 1000);

                      return;
                    }

                    setTimeout(async () => {
                      try {
                        const lastMessage = await MessageService.getLastMessage(
                          {
                            threadId: thread.id,
                          }
                        );

                        if (newMessage.id !== lastMessage.id) return;

                        const suggestions =
                          await SuggestionService.generateSuggestion({
                            numberOfResponse: 1,
                            companyId: company_id,
                            threadId: thread.id,
                          });

                        await this.sendMessage({
                          companyId: company_id,
                          channelDetailId: channel_detail_id,
                          threadId: thread.id,
                          threadApiId,
                          senderType: SenderType.BOT,
                          content: suggestions[0],
                        });
                      } catch (error) {
                        logger.error(error.message);
                      }
                    }, 5000);
                  }
                })
              );
            })
          );
        })
      );
    } catch (error) {
      logger.error(error.message);
    }
  }

  static async #messageSendSucceeded({
    companyId,
    threadId,
    messageApiId,
    senderType,
    senderId,
    content,
    timestamp,
    attachment,
    callback,
    socket,
  }) {
    const thread = await ThreadService.getThreadById(threadId);

    const customer = await CustomerService.getCustomer({
      threadId: thread.id,
    });

    const [message] = await MessageService.getOrCreateMessage(
      {
        thread_id: thread.id,
        message_api_id: messageApiId,
      },
      {
        sender_type: senderType,
        sender_id: senderId,
        content,
        timestamp,
      }
    );

    await Promise.all(
      attachment.map(async (attach) => {
        const { type, name, url } = attach;
        await AttachmentService.createAttachment({
          messageId: message.id,
          url,
          type,
          name,
        });
      })
    );

    if (senderType === SenderType.STAFF) {
      const sender = await UserService.getUserById(senderId);
      await threadNotifier.onMessageSendSucceeded({
        companyId,
        channelType: ChannelType.MESSENGER,
        thread,
        customer,
        message,
        sender,
        attachment,
        callback,
        socket,
      });
    } else if (senderType === SenderType.BOT) {
      await threadNotifier.onNewMessage({
        created: true,
        channelType: ChannelType.MESSENGER,
        companyId,
        thread,
        customer,
        message,
        attachment,
      });
    }
  }

  static async sendMessage({
    companyId,
    channelDetailId,
    threadId,
    threadApiId,
    senderType = SenderType.STAFF,
    senderId,
    content,
    attachment = [],
    socket,
    callback,
  }) {
    try {
      if (content && attachment.length > 0)
        throw new Error("Content and attachment cannot be sent together");

      if (!content && attachment.length === 0)
        throw new Error("Content or attachment must not be empty");

      const messengerChannel = await MessengerChannelModel.findOne({
        where: {
          company_id: companyId,
          id: channelDetailId,
        },
      });
      const { page_id, page_access_token } = messengerChannel;
      let messageResponse;

      if (content) {
        messageResponse = await axios.post(
          `${process.env.GRAPH_API_URL}/${page_id}/messages`,
          {
            recipient: {
              id: threadApiId,
            },
            message: {
              text: content,
            },
            messaging_type: "RESPONSE",
            access_token: page_access_token,
          }
        );
      } else {
        if (attachment.length > 1)
          throw new Error("Only one attachment can be sent at a time");

        if (!Object.values(AttachmentType).includes(attachment[0].type))
          throw new Error("Attachment type is not supported");

        messageResponse = await axios.post(
          `${process.env.GRAPH_API_URL}/${page_id}/messages`,
          {
            recipient: {
              id: threadApiId,
            },
            message: {
              attachment: {
                type: attachmentTypeMapping[attachment[0].type],
                payload: {
                  url: attachment[0].url,
                  is_reusable: true,
                },
              },
            },
            messaging_type: "RESPONSE",
            access_token: page_access_token,
          }
        );
      }

      logger.info("Message sent successfully");

      pendingMessages.set(messageResponse.data.message_id, {
        companyId,
        threadId,
        senderType,
        senderId,
        attachment,
        callback,
        socket,
      });
    } catch (error) {
      if (error.response) throw new Error(error.response.data.error.message);
      else throw new Error(error.message);
    }
  }
}
