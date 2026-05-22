import { PremiumUtilisateur } from './premiums';
import { databases, config, account } from './appwriteConfig';

let _accumulatedCredit: number = 0.00;
let _creditExpirationDate: Date | null = null;
let _currentUserId: string | null = null;

const CREDIT_TIERS = [
    { minAmount: 5000, credit: null, isPercentage: true, percentage: 0.02 },
    { minAmount: 4000, credit: 70, isPercentage: false, percentage: null },
    { minAmount: 3000, credit: 45, isPercentage: false, percentage: null },
    { minAmount: 2000, credit: 25, isPercentage: false, percentage: null },
    { minAmount: 1000, credit: 10, isPercentage: false, percentage: null },
    { minAmount: 500, credit: 1, isPercentage: false, percentage: null },
    { minAmount: 0, credit: 0, isPercentage: false, percentage: null }
] as const;

const DELIVERY_MULTIPLIERS = [
    { minDeliveries: 12, multiplier: 2 },
    { minDeliveries: 9, multiplier: 1.5 },
    { minDeliveries: 5, multiplier: 1.25 },
    { minDeliveries: 0, multiplier: 1 }
] as const;

const setInitialCreditExpiration = (): void => {
    if (!_creditExpirationDate) {
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        _creditExpirationDate = oneYearFromNow;
    }
};

const checkAndResetExpiredCredits = async (): Promise<void> => {
    if (_creditExpirationDate && new Date() > _creditExpirationDate) {
        _accumulatedCredit = 0;
        setInitialCreditExpiration();
        await persistCreditToDB();
    }
};

const roundPercentageBasedCredit = (credit: number): number => {
    const lastDigit = credit % 10;
    if (lastDigit >= 1 && lastDigit <= 4) {
        return credit - lastDigit;
    } else if (lastDigit >= 6 && lastDigit <= 9) {
        return credit + (10 - lastDigit);
    }
    return credit;
};

const calculateBaseCredit = (totalCommand: number): { credit: number; isPercentage: boolean } => {
    const tier = CREDIT_TIERS.find(t => totalCommand >= t.minAmount);

    if (!tier) {
        return { credit: 0, isPercentage: false };
    }

    if (tier.isPercentage && tier.percentage) {
        return {
            credit: totalCommand * tier.percentage,
            isPercentage: true
        };
    }

    return {
        credit: tier.credit || 0,
        isPercentage: false
    };
};

const calculateDeliveryMultiplier = (currentMonthDeliveries: number): number => {
    const multiplierTier = DELIVERY_MULTIPLIERS.find(m => currentMonthDeliveries >= m.minDeliveries);
    return multiplierTier?.multiplier || 1;
};

setInitialCreditExpiration();

const persistCreditToDB = async (): Promise<void> => {
    if (!_currentUserId) return;
    await databases.updateDocument(config.databaseId, config.usersCollectionId, _currentUserId, {
        creditCC: _accumulatedCredit,
        creditExpirationDate: _creditExpirationDate ? _creditExpirationDate.toISOString() : null,
    }).catch((e: Error) => console.error("Erreur Appwrite lors de la sauvegarde", e.message));
};
export const loadCreditFromDB = async (): Promise<void> => {
    try {
        const user = await account.get();
        _currentUserId = user.$id;
        const doc = await databases.getDocument(config.databaseId, config.usersCollectionId, user.$id);
        _accumulatedCredit = typeof doc['creditCC'] === 'number' ? doc['creditCC'] : 0;
        _creditExpirationDate = doc['creditExpirationDate'] ? new Date(doc['creditExpirationDate'] as string) : null;
    } catch (error) { const e = error as Error; console.error('Erreur Appwrite lors du chargement', e.message); }
};

export const getAvailableCredit = async (userPremiumType: PremiumUtilisateur): Promise<number> => {
    if (userPremiumType === PremiumUtilisateur.Aucun) return 0;
    await checkAndResetExpiredCredits();
    return _accumulatedCredit;
};

export const useCredit = async (amount: number): Promise<boolean> => {
    if (amount < 0 || amount > _accumulatedCredit) return false;
    _accumulatedCredit -= amount;
    await persistCreditToDB();
    return true;
};

export const simulateCreditExpiration = async (): Promise<void> => {
    _accumulatedCredit = 0;
    _creditExpirationDate = null;
    await persistCreditToDB();
};

export const returnUsedCredit = async (amount: number): Promise<boolean> => {
    if (amount > 0) {
        _accumulatedCredit += amount;
        await persistCreditToDB();
        return true;
    }
    return false;
};

export const addEarnedCredit = async (amount: number): Promise<void> => {
    if (amount > 0) {
        _accumulatedCredit += amount;
        await persistCreditToDB();
    }
};

export function calculerCCPourCommande(
    totalCommand: number,
    userPremiumStatus: PremiumUtilisateur,
    currentMonthDeliveries: number
): number {
    if (totalCommand < 0 || currentMonthDeliveries < 0) {
        return 0;
    }

    if (userPremiumStatus === PremiumUtilisateur.Aucun) {
        return 0;
    }

    const { credit: baseCredit, isPercentage } = calculateBaseCredit(totalCommand);

    const deliveryMultiplier = calculateDeliveryMultiplier(currentMonthDeliveries);
    const finalCredit = baseCredit * deliveryMultiplier;

    let adjustedCredit = Math.floor(finalCredit);

    if (isPercentage) {
        adjustedCredit = roundPercentageBasedCredit(adjustedCredit);
    }

    return adjustedCredit;
}
