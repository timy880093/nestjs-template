export interface LineProfileRes {
  userId: string;
  email?: string; // LINE DEVELOPERS email scope
  displayName?: string;
  pictureUrl?: string;
  statusMessage?: string;
  phoneNumber?: string;
  countryCode?: string;
}
