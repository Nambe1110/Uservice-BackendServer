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
  EMAIL: "Email",
};

const StatusType = {
  SUCCESS: "success",
  ERROR: "error",
  FAIL: "fail",
};

const SenderType = {
  CUSTOMER: "Customer",
  STAFF: "Staff",
  SERVICE: "Service",
};

const NumberOfChatsLimit = {
  TELEGRAM_USER: 200000,
};

export {
  UserRole,
  ThreadType,
  ChannelType,
  StatusType,
  SenderType,
  NumberOfChatsLimit,
};
