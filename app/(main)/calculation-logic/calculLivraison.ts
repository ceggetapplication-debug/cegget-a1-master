import { PremiumUtilisateur } from './premiums';

export enum TypeLivraison {
    Normal = 'normal',
    Rapid = 'rapid',
    Pickup = 'pickup',
}

interface GainsLivraison {
    driverGain: number;
    gainCEGGET: number;
}

interface ResultatFinalDeLivraison {
    tReel: number;
    MC: number;
    d: number;
    typeLivraison: TypeLivraison;
    driverGain: number;
    gainCEGGET: number;
    fraisAppli?: number;
    reductionTotalProducts?: number;
    coutApresReductionsTotalProducts?: number;
}

interface Coordonnees {
    latitude: number;
    longitude: number;
}

interface LocalisationUser {
    username: string;
    fullName: string;
    address: string;
    localisation_gps: Coordonnees;
}

interface Driver {
    id: string;
    name: string;
    location_liv: Coordonnees;
}

interface Store {
    id: string;
    name: string;
    address: string;
    imageUrl: string;
    location_mag: Coordonnees;
}

interface ResultatCalcul {
    MC: number;
    d: number;
    typeLivraison: TypeLivraison;
    fraisAppli?: number;
    reductionTotalProducts?: number;
}

export interface ReferralInfo {
    referrerId: string;
}

enum DistanceTier {
    Tier0_2km,
    Tier2_4km,
    Tier4_6km,
    Tier6_8km,
    Tier8_10km,
    Tier10_15km,
    Tier15_20km,
    TierHorsLimite,
}
interface Product {
    id: string;
    name: string;
    marque?: string;
    prix: number;
    quantity_unit_dzd_per_kg?: number;
    valeurQuantite?: number;
    uniteQuantite?: string;
    storeId: string;
    imageUrl?: string;
}

interface TarifConfig {
    tarifBase: number;
    tempsMax: number;
    tempsTolerance: number;
}

class ConfigurationTarifs {
    public static readonly X5 = 0;

    public static readonly DISTANCE_2KM = 2;
    public static readonly DISTANCE_4KM = 4;
    public static readonly DISTANCE_6KM = 6;
    public static readonly DISTANCE_8KM = 8;
    public static readonly DISTANCE_10KM = 10;
    public static readonly DISTANCE_15KM = 15;
    public static readonly DISTANCE_20KM = 20;

    public static readonly SEUIL_PROXIMITE_KM = 0.002;
    public static readonly SEUIL_NOTIFICATION_KM = 0.5;

    public static readonly TEMPS_RAPIDE_0_2KM = { tempsMax: 15, tempsTolerance: 25 };
    public static readonly TEMPS_RAPIDE_2_4KM = { tempsMax: 20, tempsTolerance: 35 };
    public static readonly TEMPS_RAPIDE_4_6KM = { tempsMax: 25, tempsTolerance: 45 };
    public static readonly TEMPS_RAPIDE_6_8KM = { tempsMax: 30, tempsTolerance: 50 };
    public static readonly TEMPS_RAPIDE_8_10KM = { tempsMax: 35, tempsTolerance: 55 };
    public static readonly TEMPS_RAPIDE_10_15KM = { tempsMax: 45, tempsTolerance: 60 };
    public static readonly TEMPS_RAPIDE_15_20KM = { tempsMax: 50, tempsTolerance: 70 };

    public static readonly TEMPS_NORMAL_0_2KM = { tempsMax: 40, tempsTolerance: 50 };
    public static readonly TEMPS_NORMAL_2_4KM = { tempsMax: 50, tempsTolerance: 60 };
    public static readonly TEMPS_NORMAL_4_6KM = { tempsMax: 50, tempsTolerance: 60 };
    public static readonly TEMPS_NORMAL_6_8KM = { tempsMax: 60, tempsTolerance: 70 };
    public static readonly TEMPS_NORMAL_8_10KM = { tempsMax: 70, tempsTolerance: 80 };
    public static readonly TEMPS_NORMAL_10_15KM = { tempsMax: 90, tempsTolerance: 100 };
    public static readonly TEMPS_NORMAL_15_20KM = { tempsMax: 100, tempsTolerance: 150 };

    public static readonly TARIFS_BASE_NORMAL: { [key in DistanceTier]?: number } = {
        [DistanceTier.Tier0_2km]: 100,
        [DistanceTier.Tier2_4km]: 150,
        [DistanceTier.Tier4_6km]: 200,
        [DistanceTier.Tier6_8km]: 250,
        [DistanceTier.Tier8_10km]: 300,
        [DistanceTier.Tier10_15km]: 400,
        [DistanceTier.Tier15_20km]: 500,
        [DistanceTier.TierHorsLimite]: 0,
    };

    public static readonly TARIFS_BASE_RAPID: { [key in DistanceTier]?: number } = {
        [DistanceTier.Tier0_2km]: 200,
        [DistanceTier.Tier2_4km]: 300,
        [DistanceTier.Tier4_6km]: 400,
        [DistanceTier.Tier6_8km]: 500,
        [DistanceTier.Tier8_10km]: 600,
        [DistanceTier.Tier10_15km]: 800,
        [DistanceTier.Tier15_20km]: 1000,
        [DistanceTier.TierHorsLimite]: 0,
    };

    public static readonly FRAIS_APPLI_PAR_DISTANCE: { [key in DistanceTier]?: number } = {
        [DistanceTier.Tier0_2km]: 50,
        [DistanceTier.Tier2_4km]: 40,
        [DistanceTier.Tier4_6km]: 30,
        [DistanceTier.Tier6_8km]: 20,
        [DistanceTier.Tier8_10km]: 0,
        [DistanceTier.Tier10_15km]: 20,
        [DistanceTier.Tier15_20km]: 30,
        [DistanceTier.TierHorsLimite]: 0,
    };

    public static readonly GAINS_DRIVER_NORMAL: { [key in DistanceTier]?: number } = {
        [DistanceTier.Tier0_2km]: 70,
        [DistanceTier.Tier2_4km]: 100,
        [DistanceTier.Tier4_6km]: 130,
        [DistanceTier.Tier6_8km]: 170,
        [DistanceTier.Tier8_10km]: 200,
        [DistanceTier.Tier10_15km]: 270,
        [DistanceTier.Tier15_20km]: 350,
        [DistanceTier.TierHorsLimite]: 0,
    };

    public static readonly GAINS_DRIVER_RAPID: { [key in DistanceTier]?: number } = {
        [DistanceTier.Tier0_2km]: 140,
        [DistanceTier.Tier2_4km]: 200,
        [DistanceTier.Tier4_6km]: 260,
        [DistanceTier.Tier6_8km]: 340,
        [DistanceTier.Tier8_10km]: 400,
        [DistanceTier.Tier10_15km]: 540,
        [DistanceTier.Tier15_20km]: 700,
        [DistanceTier.TierHorsLimite]: 0,
    };

    public static getDistanceTier(d: number): DistanceTier {
        if (d <= ConfigurationTarifs.DISTANCE_2KM) return DistanceTier.Tier0_2km;
        if (d <= ConfigurationTarifs.DISTANCE_4KM) return DistanceTier.Tier2_4km;
        if (d <= ConfigurationTarifs.DISTANCE_6KM) return DistanceTier.Tier4_6km;
        if (d <= ConfigurationTarifs.DISTANCE_8KM) return DistanceTier.Tier6_8km;
        if (d <= ConfigurationTarifs.DISTANCE_10KM) return DistanceTier.Tier8_10km;
        if (d <= ConfigurationTarifs.DISTANCE_15KM) return DistanceTier.Tier10_15km;
        if (d <= ConfigurationTarifs.DISTANCE_20KM) return DistanceTier.Tier15_20km;
        return DistanceTier.TierHorsLimite;
    }

    public static getFraisAppliForDistance(d: number): number {
        const tier = ConfigurationTarifs.getDistanceTier(d);
        console.log(`DEBUG: Calcul fraisAppli pour distance ${d}km, Tier: ${DistanceTier[tier]}, Frais: ${ConfigurationTarifs.FRAIS_APPLI_PAR_DISTANCE[tier] || 0}`);
        return ConfigurationTarifs.FRAIS_APPLI_PAR_DISTANCE[tier] || 0;
    }

    public static getGainDriverForDistance(d: number, typeLivraison: TypeLivraison): number {
        const tier = ConfigurationTarifs.getDistanceTier(d);
        if (typeLivraison === TypeLivraison.Normal) {
            return ConfigurationTarifs.GAINS_DRIVER_NORMAL[tier] || 0;
        }
        if (typeLivraison === TypeLivraison.Rapid) {
            return ConfigurationTarifs.GAINS_DRIVER_RAPID[tier] || 0;
        }
        return 0;
    }
}

class GestionnaireTemps {
    private compteurMinutes: number = 0;
    private intervalId: ReturnType<typeof setTimeout> | null = null;

    demarrerCompteur(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        this.compteurMinutes = 0;
        this.intervalId = setInterval(() => {
            this.compteurMinutes++;
        }, 60000);
    }

    arreterCompteur(): number {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        const finalTime = this.compteurMinutes;
        this.compteurMinutes = 0;
        return finalTime;
    }


    getCompteurValue(): number {
        return this.compteurMinutes;
    }

    estActif(): boolean {
        return this.intervalId !== null;
    }
}

class CalculateurLivraison {
    private gestionnaireTemps: GestionnaireTemps;

    constructor() {
        this.gestionnaireTemps = new GestionnaireTemps();
    }

    demarrerCompteur(): void {
        this.gestionnaireTemps.demarrerCompteur();
    }

    arreterCompteur(): number {
        return this.gestionnaireTemps.arreterCompteur();
    }

    getCompteurValue(): number {
        return this.gestionnaireTemps.getCompteurValue();
    }

    estActif(): boolean {
        return this.gestionnaireTemps.estActif();
    }

    public dis(acheteur: LocalisationUser, driver: Driver): number {
        const distance = this.calculerDistance(acheteur.localisation_gps, driver.location_liv);
        return Math.round(distance * 100) / 100;
    }

    private calculerDistance(point1: Coordonnees, point2: Coordonnees): number {
        const R = 6371;
        const dLat = this.degreesEnRadians(point2.latitude - point1.latitude);
        const dLon = this.degreesEnRadians(point2.longitude - point1.longitude);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.degreesEnRadians(point1.latitude)) *
            Math.cos(this.degreesEnRadians(point2.latitude)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private degreesEnRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    comparerDistances(stores: Store[], acheteur: LocalisationUser): number {
        if (stores.length === 0) return 0;
        let distanceMax = 0;

        for (const store of stores) {
            const distance = this.calculerDistance(store.location_mag, acheteur.localisation_gps);
            if (distance > distanceMax) {
                distanceMax = distance;
            }
        }
        return distanceMax;
    }

    public getTarifConfiguration(d: number, typeLivraison: TypeLivraison): TarifConfig | null {
        const tier = ConfigurationTarifs.getDistanceTier(d);

        if (typeLivraison === TypeLivraison.Rapid) {
            const tarifBase = ConfigurationTarifs.TARIFS_BASE_RAPID[tier];
            if (tarifBase === undefined) {
                console.warn(`Tarif de base RAPID non défini pour le tier ${DistanceTier[tier]} (distance: ${d})`);
                return null;
            }

            switch (tier) {
                case DistanceTier.Tier0_2km: return { tarifBase, ...ConfigurationTarifs.TEMPS_RAPIDE_0_2KM };
                case DistanceTier.Tier2_4km: return { tarifBase, ...ConfigurationTarifs.TEMPS_RAPIDE_2_4KM };
                case DistanceTier.Tier4_6km: return { tarifBase, ...ConfigurationTarifs.TEMPS_RAPIDE_4_6KM };
                case DistanceTier.Tier6_8km: return { tarifBase, ...ConfigurationTarifs.TEMPS_RAPIDE_6_8KM };
                case DistanceTier.Tier8_10km: return { tarifBase, ...ConfigurationTarifs.TEMPS_RAPIDE_8_10KM };
                case DistanceTier.Tier10_15km: return { tarifBase, ...ConfigurationTarifs.TEMPS_RAPIDE_10_15KM };
                case DistanceTier.Tier15_20km: return { tarifBase, ...ConfigurationTarifs.TEMPS_RAPIDE_15_20KM };
                default: return null;
            }
        }

        if (typeLivraison === TypeLivraison.Normal) {
            const tarifBase = ConfigurationTarifs.TARIFS_BASE_NORMAL[tier];
            if (tarifBase === undefined) {
                console.warn(`Tarif de base NORMAL non défini pour le tier ${DistanceTier[tier]} (distance: ${d})`);
                return null;
            }

            switch (tier) {
                case DistanceTier.Tier0_2km: return { tarifBase, ...ConfigurationTarifs.TEMPS_NORMAL_0_2KM };
                case DistanceTier.Tier2_4km: return { tarifBase, ...ConfigurationTarifs.TEMPS_NORMAL_2_4KM };
                case DistanceTier.Tier4_6km: return { tarifBase, ...ConfigurationTarifs.TEMPS_NORMAL_4_6KM };
                case DistanceTier.Tier6_8km: return { tarifBase, ...ConfigurationTarifs.TEMPS_NORMAL_6_8KM };
                case DistanceTier.Tier8_10km: return { tarifBase, ...ConfigurationTarifs.TEMPS_NORMAL_8_10KM };
                case DistanceTier.Tier10_15km: return { tarifBase, ...ConfigurationTarifs.TEMPS_NORMAL_10_15KM };
                case DistanceTier.Tier15_20km: return { tarifBase, ...ConfigurationTarifs.TEMPS_NORMAL_15_20KM };
                default: return null;
            }
        }

        return null;
    }

    public getFraisLivraisonBase(d: number, typeLivraison: TypeLivraison): number {
        if (typeLivraison === TypeLivraison.Pickup) return 0;

        const config = this.getTarifConfiguration(d, typeLivraison);
        if (!config) {
            console.warn(`Aucune configuration de tarif trouvée pour distance ${d} et type ${typeLivraison}`);
            return 0;
        }

        return config.tarifBase;
    }

    public calculerMC(tReel: number, d: number, typeLivraison: TypeLivraison, mcApresAvantages: number): number {
        if (typeLivraison === TypeLivraison.Pickup) return 0;

        const config = this.getTarifConfiguration(d, typeLivraison);
        if (!config) {
            console.warn(`Aucune configuration de tarif trouvée pour distance ${d} et type ${typeLivraison}`);
            return 0;
        }

        let mcFinal = this.appliquerReductionTemps(tReel, mcApresAvantages, config.tempsMax, config.tempsTolerance);

        return mcFinal;
    }

    private appliquerReductionTemps(tReel: number, tarifBase: number, tempsMax: number, tempsTolerance: number): number {
        if (tReel <= tempsMax) {
            return tarifBase;
        } else if (tReel <= tempsTolerance) {
            return tarifBase / 2;
        } else {
            return ConfigurationTarifs.X5;
        }
    }

    public verifierProximiteEtArreterCompteur(acheteur: LocalisationUser, driver: Driver): number | null {
        if (!this.gestionnaireTemps.estActif()) {
            return null;
        }

        const distanceActuelle = this.dis(acheteur, driver);

        if (distanceActuelle <= ConfigurationTarifs.SEUIL_PROXIMITE_KM) {
            return this.arreterCompteur();
        }

        return null;
    }
}




interface StorageProvider {
    setItem(key: string, value: string): void;
    getItem(key: string): string | null;
    removeItem(key: string): void;
}

class LocalStorageProvider implements StorageProvider {
    setItem(key: string, value: string): void { }
    getItem(key: string): string | null { return null; }
    removeItem(key: string): void { }
}

class ReferralManager {
    private static readonly REFERRER_STORAGE_KEY = 'pendingReferrerId';
    private static readonly APP_SCHEME = 'monapp';
    private static readonly DEEPLINK_HOST = 'referral';
    private static readonly FREE_DELIVERY_REFERRAL_THRESHOLD = 6;

    private storageProvider: StorageProvider;

    constructor(storageProvider?: StorageProvider) {
        this.storageProvider = storageProvider || new LocalStorageProvider();
    }

    public generateReferralLink(referrerUserId: string): string {
        return `${ReferralManager.APP_SCHEME}://${ReferralManager.DEEPLINK_HOST}?referrerId=${referrerUserId}`;
    }

    public parseIncomingReferralLink(incomingUrl: string): ReferralInfo | null {
        return null;
    }

    public storePendingReferrerId(referrerId: string): void {
        this.storageProvider.setItem(ReferralManager.REFERRER_STORAGE_KEY, referrerId);
    }

    public getPendingReferrerId(): string | null {
        return this.storageProvider.getItem(ReferralManager.REFERRER_STORAGE_KEY);
    }

    public clearPendingReferrerId(): void {
        this.storageProvider.removeItem(ReferralManager.REFERRER_STORAGE_KEY);
    }

    public hasReachedFreeDeliveryThreshold(successfulReferralsCount: number): boolean {
        return successfulReferralsCount >= ReferralManager.FREE_DELIVERY_REFERRAL_THRESHOLD;
    }

    public getFreeDeliveryThreshold(): number {
        return ReferralManager.FREE_DELIVERY_REFERRAL_THRESHOLD;
    }
}

const calculateur = new CalculateurLivraison();
const referralManager = new ReferralManager();

export function calculerLivraisonPourPanier(
    stores: Store[],
    acheteur: LocalisationUser,
    typeLivraison: TypeLivraison,
    premiumType: PremiumUtilisateur,
    deliveriesThisMonth: number,
    totalProducts: number
): ResultatCalcul {
    const d = stores && stores.length > 0 ? Math.round(calculateur.comparerDistances(stores, acheteur) * 100) / 100 : 0;

    if (d > ConfigurationTarifs.DISTANCE_20KM) {
        return {
            MC: 0,
            d,
            typeLivraison,
            fraisAppli: 0,
            reductionTotalProducts: 0,
        };
    }

    const coutLivraisonBase: number = calculateur.getFraisLivraisonBase(d, typeLivraison);

    let coutLivraisonApresAvantages: number = coutLivraisonBase;

    if (typeLivraison === TypeLivraison.Normal) {
        coutLivraisonApresAvantages = appliquerAvantagesPremium(
            coutLivraisonBase,
            premiumType,
            deliveriesThisMonth,
            totalProducts,
            typeLivraison
        );
    }

    const reductionTotalProducts: number = Math.max(0, coutLivraisonBase - coutLivraisonApresAvantages);

    const fraisAppli: number = ConfigurationTarifs.getFraisAppliForDistance(d);

    const MC_total_estime: number = coutLivraisonApresAvantages;

    return {
        MC: MC_total_estime,
        d,
        typeLivraison,
        fraisAppli,
        reductionTotalProducts,
    };
}


function appliquerAvantagesPremium(
    MC: number,
    premiumType: PremiumUtilisateur,
    deliveriesThisMonth: number,
    totalProducts: number,
    typeLivraison: TypeLivraison
): number {
    if (typeLivraison === TypeLivraison.Rapid) {
        return MC;
    }

    if (totalProducts >= 5000) {
        return 0;
    }

    if ((premiumType as any === 'Level2') &&
        deliveriesThisMonth >= 5) {
        return 0;
    }

    if (premiumType === PremiumUtilisateur.Aucun) {
        if (totalProducts >= 3800) {
            return MC / 4;
        } else if (totalProducts >= 2800) {
            return MC / 2;
        }
    }

    return MC;
}

export function calculerGainsLivraison(finalMC: number, typeLivraison: TypeLivraison, distance: number, tReel: number): GainsLivraison {
    if (typeLivraison === TypeLivraison.Pickup) {
        return { driverGain: 0, gainCEGGET: 0 };
    }

    const tarifConfig = calculateur.getTarifConfiguration(distance, typeLivraison);
    if (!tarifConfig) {
        console.warn(`Aucune configuration de tarif trouvée pour distance ${distance} et type ${typeLivraison} pour le calcul des gains.`);
        return { driverGain: 0, gainCEGGET: 0 };
    }

    const baseGainDriverTheorique = ConfigurationTarifs.getGainDriverForDistance(distance, typeLivraison);
    let driverGainFinal: number;
    if (tReel <= tarifConfig.tempsMax) {
        driverGainFinal = baseGainDriverTheorique;
    } else if (tReel > tarifConfig.tempsMax && tReel <= tarifConfig.tempsTolerance) {
        driverGainFinal = Math.max(0, Math.min(baseGainDriverTheorique / 2, finalMC));
    } else {
        driverGainFinal = 0;
    }
    const gainCEGGET = finalMC - driverGainFinal;

    return { driverGain: driverGainFinal, gainCEGGET };
}

export function calculerCoutFinalAvecTempsReel(
    tReel: number,
    distance: number,
    typeLivraison: TypeLivraison,
    premiumType: PremiumUtilisateur,
    deliveriesThisMonth: number,
    totalProducts: number
): ResultatFinalDeLivraison {
    console.log(`DEBUG START: tReel=${tReel}, distance=${distance}, typeLivraison=${typeLivraison}, premiumType=${premiumType}, deliveriesThisMonth=${deliveriesThisMonth}, totalProducts=${totalProducts}`);

    let tReelForCalculation = tReel;
    if (tReel === 0.03) { // Si tReel est le marqueur temporaire de 0.03
        tReelForCalculation = 40; // On le transforme en 40 minutes pour le calcul
    }

    const coutLivraisonBase: number = calculateur.getFraisLivraisonBase(distance, typeLivraison);

    let coutApresReductionsTotalProducts: number = coutLivraisonBase;
    if (typeLivraison === TypeLivraison.Normal) {
        coutApresReductionsTotalProducts = appliquerAvantagesPremium(
            coutLivraisonBase,
            premiumType,
            deliveriesThisMonth,
            totalProducts,
            typeLivraison
        );
    }

    const reductionTotalProducts: number = Math.max(0, coutLivraisonBase - coutApresReductionsTotalProducts);
    const fraisAppliCalculated: number = ConfigurationTarifs.getFraisAppliForDistance(distance);
    const finalServiceDeliveryCost_MC: number = calculateur.calculerMC(tReelForCalculation, distance, typeLivraison, coutApresReductionsTotalProducts);
    const gains = calculerGainsLivraison(finalServiceDeliveryCost_MC, typeLivraison, distance, tReelForCalculation);


    return {
        tReel: tReelForCalculation,
        MC: finalServiceDeliveryCost_MC,
        d: distance,
        typeLivraison,
        driverGain: gains.driverGain,
        gainCEGGET: gains.gainCEGGET,
        fraisAppli: fraisAppliCalculated,
        reductionTotalProducts: reductionTotalProducts,
    };
}

export function calculerTotalCommande(
    allProducts: Product[],
    selectedProductIds: string[]
): number {
    const totalCommand = allProducts.reduce((sum, product) => {
        if (selectedProductIds.includes(product.id)) {
            return sum + ((product.valeurQuantite ?? 0) * product.prix);
        }
        return sum;
    }, 0);

    return totalCommand;
}


export {
    calculateur,
    referralManager,
    ConfigurationTarifs,
    DistanceTier,
    PremiumUtilisateur
};
export type {
    Store,
    LocalisationUser,
    ResultatCalcul,
    Coordonnees,
    ResultatFinalDeLivraison,
    Driver,
    StorageProvider,
    GainsLivraison,
    TarifConfig
};
