const UserRole = {
  OWNER: "Owner",
  MANAGER: "Manager",
  STAFF: "Staff",
};

const ThreadType = {
  GROUP: "Group",
  PRIVATE: "Private",
};

const ChannelType = {
  TELEGRAM_BOT: "TelegramBot",
  TELEGRAM_USER: "TelegramUser",
  MESSENGER: "Messenger",
  VIBER: "Viber",
  INSTAGRAM: "Instagram",
};

const StatusType = {
  SUCCESS: "success",
  ERROR: "error",
  FAIL: "fail",
};

const SenderType = {
  CUSTOMER: "Customer",
  STAFF: "Staff",
  BOT: "Bot",
};

const AttachmentType = {
  IMAGE: "Image",
  VIDEO: "Video",
  AUDIO: "Audio",
  FILE: "File",
};

const ChatbotMode = {
  OFF: "Off",
  SUGGESTION: "Suggestion",
  AUTO_REPLY: "Auto reply",
};

const DefaultGptModel = {
  GPT_3_5: "text-davinci-003",
};

export {
  UserRole,
  ThreadType,
  ChannelType,
  StatusType,
  SenderType,
  AttachmentType,
  ChatbotMode,
  DefaultGptModel,
};
