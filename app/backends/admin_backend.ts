import { ID, Query } from "react-native-appwrite";
import { databases, config } from "../(main)/calculation-logic/appwriteConfig";
import { Delivery } from "../(main)/calculation-logic/cart-types";
import { deleteFromR2, cleanupOldStories as cleanupOldStoriesR2, cleanupInactiveAccounts as cleanupInactiveAccountsR2 } from "../(main)/calculation-logic/imagesLogic";

const DB_ID = config.databaseId;

export async function archiveOldDeliveries() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const isoDate = thirtyDaysAgo.toISOString();

    const response = await databases.listDocuments<Delivery>(
      DB_ID,
      config.deliveriesCollectionId,
      [
        Query.lessThan("createdAt", isoDate),
        Query.equal("status", "DELIVERED")
      ]
    );

    for (const doc of response.documents) {
      try {
        await databases.updateDocument(DB_ID, config.deliveriesCollectionId, doc.$id, {
          userLocation: null,
          driverLocation: null,
          driver: null,
          deliveryType: null,
        });
      } catch (err) { }
    }
    return response.documents.length;
  } catch (error) { return 0; }
}

export async function cleanupOldStories() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const isoDate = thirtyDaysAgo.toISOString();

    const response = await databases.listDocuments(
      DB_ID,
      "col_shared",
      [Query.lessThan("createdAt", isoDate)]
    );

    for (const doc of response.documents) {
      try {
        await deleteFromR2(doc.fileId);
        await databases.deleteDocument(DB_ID, "col_shared", doc.$id);
      } catch (err) { }
    }
    return response.documents.length;
  } catch (error) { return 0; }
}

export async function cleanupInactiveAccounts() {
  try {
    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);
    const isoDate = fortyFiveDaysAgo.toISOString();

    const response = await databases.listDocuments(
      DB_ID,
      config.usersCollectionId,
      [Query.lessThan("lastActiveAt", isoDate)]
    );

    for (const doc of response.documents) {
      try {
        if (doc.imageId) await deleteFromR2(doc.imageId);
        await databases.deleteDocument(DB_ID, config.usersCollectionId, doc.$id);
      } catch (err) { }
    }
    return response.documents.length;
  } catch (error) { return 0; }
}
