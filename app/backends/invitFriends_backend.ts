import { databases, config, Query } from '../(main)/calculation-logic/appwriteConfig';

type BaseDocument = Awaited<ReturnType<typeof databases.listDocuments>>['documents'][0];

export interface AppwriteUserDoc extends BaseDocument {
  $id: string;
  userId: string;
  pseudo?: string;
  livraisonsGratuites?: number;
}

export const rewardParrainByUserId = async (parrainUserId: string) => {
  try {
    const response = await databases.listDocuments<AppwriteUserDoc>(
      config.databaseId,
      config.usersCollectionId,
      [Query.equal('userId', parrainUserId)]
    );
    if (response.documents.length === 0) return;

    const parrain = response.documents[0];
    const actuel = parrain.livraisonsGratuites || 0;

    await databases.updateDocument(
      config.databaseId,
      config.usersCollectionId,
      parrain.$id,
      { livraisonsGratuites: actuel + 1 }
    );
  } catch (error) {
    console.error(error);
  }
};
