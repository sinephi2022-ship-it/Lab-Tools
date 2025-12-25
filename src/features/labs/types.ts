import { Timestamp } from "firebase/firestore";

export type Lab = {
  id: string;
  name: string;
  type: "personal" | "shared";
  ownerUid: string;
  members: string[]; // includes ownerUid
  isPublic: boolean; // shared labs can be public (visible in lobby)
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
