import { Client, Databases, Account, Query, ID, Models, Functions } from 'react-native-appwrite';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('cegget_project')
    .setPlatform('com.koceiladrk.cegget');

export { client, Query, ID, Models };
export const databases = new Databases(client);
export const account = new Account(client);
export const functions = new Functions(client);

export const config = {
    databaseId: 'database_main',
    productsCollectionId: 'products',
    favoritesCollectionId: 'favorites',
    ordersCollectionId: 'orders',
    usersCollectionId: 'users',
    storesCollectionId: 'stores',
    deliveriesCollectionId: 'deliveries',
    feedbackCollectionId: 'feedback_de_suppression',
    premiumCollectionId: 'premium_utilisateurs',
    invitationsCollectionId: 'invitations',
} as const;

export const r2Config = {
    workerUrl: 'https://mon-worker.mon-compte.workers.dev',
    publicUrl: 'https://pub-xxxxxxxxxxxxx.r2.dev',
    bucketName: 'cegget-images',
    folders: {
        STORES: "stores/",
        PRODUCTS: "products/",
        PROFILES: "profiles/",
        SHARED: "shared/",
        GROUPS: "groups/",
        DRIVERS: "drivers/",
        IDS: "ids/",
        PORTES: "portes/",
        LOGOS: "logos/",
    }
} as const;
