import { databases, config, Query } from '../(main)/calculation-logic/appwriteConfig';

type BaseDocument = Awaited<ReturnType<typeof databases.listDocuments>>['documents'][0];

export interface AppwriteStoreDoc extends BaseDocument {
  $id: string;
  nom?: string;
  name?: string;
  photo?: string;
  imageId?: string;
  address?: string;
}

export interface AppwriteProductDoc extends BaseDocument {
  $id: string;
  nom?: string;
  name?: string;
  prix?: number;
  price?: number;
  oldPrice?: number;
  marque?: string;
  brand?: string;
  imageId?: string;
  category?: string;
  productType?: string;
  descriptionFr?: string;
  descriptionKab?: string;
}

export const fetchStoresByType = async (typeId: string) => {
  try {
    const response = await databases.listDocuments<AppwriteStoreDoc>(
      config.databaseId,
      config.storesCollectionId,
      [Query.equal('type', typeId)]
    );

    return response.documents.map((doc: AppwriteStoreDoc) => ({
      id: doc.$id,
      name: doc.name || doc.nom || 'Sans Nom',
      photo: doc.photo || '',
      imageId: doc.imageId || null,
      address: doc.address || '',
      categories: [],
    }));
  } catch (error) {
    console.error("Erreur backend - stores : ", error);
    return [];
  }
};

export const fetchProductsByStore = async (storeId: string) => {
  try {
    const response = await databases.listDocuments<AppwriteProductDoc>(
      config.databaseId,
      config.productsCollectionId,
      [
        Query.equal('storeId', storeId),
        Query.limit(200)
      ]
    );

    return response.documents.map((doc: AppwriteProductDoc) => ({
      id: doc.$id,
      name: doc.name || doc.nom,
      prix: doc.price || doc.prix,
      oldPrice: doc.oldPrice || null,
      marque: doc.brand || doc.marque,
      imageId: doc.imageId || null,
      category: { id: doc.category || '', name: '' },
      productType: { id: doc.productType || '', name: '' },
      descriptionFr: doc.descriptionFr || '',
      descriptionKab: doc.descriptionKab || '',
    }));
  } catch (error) {
    console.error("Erreur backend - products : ", error);
    return [];
  }
};
