export type UserSettings = {
  id: string;
  userId: string;
  phoneNumber: string;
  isDarkMode: boolean;
  notifyByEmail: boolean;
  notifyByMessage: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserSettingsCreate = {
  userId: string;
  phoneNumber: string;
  isDarkMode: boolean;
  notifyByEmail: boolean;
  notifyByMessage: boolean;
};

export type UserSettingsUpdate = {
  phoneNumber: string;
  isDarkMode: boolean;
  notifyByEmail: boolean;
  notifyByMessage: boolean;
};

export type UserSettingsView = {
  phoneNumber: string;
  isDarkMode: boolean;
  notifyByEmail: boolean;
  notifyByMessage: boolean;
};
