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
} from "../../../constants.js";
import logger from "../../../config/logger/index.js";
import { threadNotifier } from "../../thread/threadNotifier.js";
import ThreadService from "../../thread/threadService.js";
import UserService from "../../user/userService.js";
import CustomerService from "../../customer/customerService.js";
import MessageService from "../../message/messageService.js";
import AttachmentService from "../../attachment/attachmentService.js";
import S3 from "../../../modules/S3.js";

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
  static async getPages({ userId, userAccessToken, companyId }) {
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
          pages.push({
            id: page.id,
            name: page.name,
            access_token: page.access_token,
          });
        });

        if (!response.data.paging.next) break;
        after = response.data.paging.cursors.after;
      }

      const pictures = await Promise.all(
        pages.map((page) =>
          axios.get(`${process.env.GRAPH_API_URL}/${page.id}/picture`, {
            params: {
              access_token: page.access_token,
              redirect: false,
              height: 100,
              width: 100,
            },
          })
        )
      );

      const messengerChannels = await MessengerChannelModel.findAll({
        where: {
          company_id: companyId,
        },
      });

      const connectedPages = messengerChannels.map(
        (channel) => channel.page_id
      );

      pages.forEach((page, index) => {
        page.image_url = pictures[index].data.data.url;
        page.is_connected = connectedPages.includes(page.id);
      });

      return pages;
    } catch (error) {
      if (error.response)
        throw new AppError(
          error.response.data.error.message,
          error.response.status
        );
      else throw new Error(error.message);
    }
  }

  static async connectPage({ pageId, pageAccessToken, companyId }) {
    try {
      await axios.post(
        `${process.env.GRAPH_API_URL}/${pageId}/subscribed_apps`,
        {
          subscribed_fields: ["messages", "message_echoes"],
          access_token: pageAccessToken,
        }
      );

      const meResponse = await axios.get(
        `${process.env.GRAPH_API_URL}/${pageId}`,
        {
          params: {
            access_token: pageAccessToken,
          },
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

      const pictureUrl = await S3.uploadFromUrlToS3({
        url: pictureResponse.data.data.url,
        companyId,
      });

      const [newMessengerChannel] = await MessengerChannelModel.findOrCreate({
        where: {
          company_id: companyId,
          page_id: pageId,
        },
        defaults: {
          page_access_token: pageAccessToken,
        },
      });

      const channel = await ChannelService.createChannel({
        companyId,
        type: ChannelType.MESSENGER,
        channelDetailId: newMessengerChannel.id,
        name: meResponse.data.name,
        imageUrl: pictureUrl,
      });

      return {
        channel,
        detail: newMessengerChannel,
      };
    } catch (error) {
      if (error.response)
        throw new AppError(
          error.response.data.error.message,
          error.response.status
        );
      else throw new Error(error.message);
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
                  senderId: pendingSenderId,

                  attachment,
                  callback,
                  socket,
                } = pendingMessages.get(messageApiId);

                await this.#messageSendSucceeded({
                  companyId,
                  threadId,
                  messageApiId,
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
                `SELECT channel.id, channel.company_id, messenger_channel.page_access_token
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
                  const { company_id, page_access_token } = channel;
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

                  const pictureUrl = await S3.uploadFromUrlToS3({
                    url: profile_pic,
                    companyId: company_id,
                  });

                  const [customer] = await CustomerService.getOrCreateCustomer(
                    {
                      thread_id: thread.id,
                      company_id,
                      customer_api_id: customerApiId,
                    },
                    {
                      first_name: last_name,
                      last_name: `${middle_name} ${first_name}`,
                      image_url: pictureUrl,
                      alias: name,
                      profile: `m.me/${customerApiId}`,
                    }
                  );

                  if (!thread.image_url) {
                    thread.image_url = pictureUrl;
                    await thread.save();
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
                      companyId: this.companyId,
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
        sender_type: SenderType.STAFF,
        sender_id: senderId,
        content,
        timestamp,
      }
    );

    const sender = await UserService.getUserById(senderId);

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

    await threadNotifier.onMessageSendSucceeded({
      companyId,
      channelType: ChannelType.TELEGRAM_USER,
      thread,
      customer,
      message,
      sender,
      attachment,
      callback,
      socket,
    });
  }

  static async sendMessage({
    companyId,
    channelDetailId,
    threadId,
    threadApiId,
    senderId,
    content,
    attachment,
    callback,
    socket,
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

      pendingMessages.set(messageResponse.data.message_id, {
        companyId,
        threadId,
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
