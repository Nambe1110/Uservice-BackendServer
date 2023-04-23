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

const HOST_URL = "https://graph.facebook.com/v16.0";

export default class MessengerService {
  static async getPages({ userId, userAccessToken }) {
    try {
      const tokenResponse = await axios.get(`${HOST_URL}/oauth/access_token`, {
        params: {
          grant_type: "fb_exchange_token",
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          fb_exchange_token: userAccessToken,
        },
      });

      userAccessToken = tokenResponse.data.access_token;

      const pages = [];
      let after = null;

      while (true) {
        const response = await axios.get(`${HOST_URL}/${userId}/accounts`, {
          params: {
            access_token: userAccessToken,
            after,
          },
        });

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
          axios.get(`${HOST_URL}/${page.id}/picture`, {
            params: {
              access_token: page.access_token,
              redirect: false,
              height: 100,
              width: 100,
            },
          })
        )
      );

      pages.forEach((page, index) => {
        page.image_url = pictures[index].data.data.url;
      });

      return pages;
    } catch (error) {
      throw new AppError(
        error.response.data.error.message,
        error.response.status
      );
    }
  }

  static async connectPage({ pageId, pageAccessToken, companyId }) {
    try {
      await axios.post(`${HOST_URL}/${pageId}/subscribed_apps`, {
        subscribed_fields: ["messages", "message_echoes"],
        access_token: pageAccessToken,
      });

      const meResponse = await axios.get(`${HOST_URL}/${pageId}`, {
        params: {
          access_token: pageAccessToken,
        },
      });

      const pictureResponse = await axios.get(`${HOST_URL}/${pageId}/picture`, {
        params: {
          access_token: pageAccessToken,
          redirect: false,
          height: 100,
          width: 100,
        },
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
        imageUrl: pictureResponse.data.data.url,
      });

      return {
        channel,
        detail: newMessengerChannel,
      };
    } catch (error) {
      throw new AppError(
        error.response.data.error.message,
        error.response.status
      );
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
                    `${HOST_URL}/${customerApiId}`,
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
                      first_name: `${middle_name} ${first_name}`,
                      last_name,
                      image_url: profile_pic,
                      alias: name,
                    }
                  );

                  if (!thread.image_url) {
                    thread.image_url = profile_pic;
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

                  await Promise.all(
                    attachments.map(async (attach) => {
                      const {
                        type,
                        payload: { url },
                      } = attach;

                      let attachmentType;

                      switch (type) {
                        case "image":
                          attachmentType = AttachmentType.IMAGE;
                          break;
                        case "video":
                          attachmentType = AttachmentType.VIDEO;
                          break;
                        case "audio":
                          attachmentType = AttachmentType.AUDIO;
                          break;
                        case "file":
                          attachmentType = AttachmentType.FILE;
                          break;
                        default:
                          attachmentType = AttachmentType.FILE;
                          break;
                      }

                      const newAttchment =
                        await AttachmentService.createAttachment({
                          message_id: newMessage.id,
                          url,
                          type: attachmentType,
                        });

                      attachment.push(newAttchment);
                    })
                  );

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
}
