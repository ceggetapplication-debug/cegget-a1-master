import type { Product } from '@/app/types';
import { DB_CONFIG } from '@/app/utils/vars';
import { databases } from '@/services/api/init';
import { useState, useEffect, useCallback } from 'react';
import { Query } from 'react-native-appwrite';


export const useProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProducts = useCallback(async () => {
        try {
            const response = await databases.listDocuments(
                DB_CONFIG.DATABASE_ID,
                DB_CONFIG.PRODUCTS_COLLECTION_ID,
                [Query.orderDesc('$createdAt')]
            );
            setProducts(response.documents as unknown as Product[]);
        } catch (error) {
            console.log('Erreur lors de la récupération des produits:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchProducts();
    }, [fetchProducts]);

    return { products, loading, refreshing, onRefresh };
};
