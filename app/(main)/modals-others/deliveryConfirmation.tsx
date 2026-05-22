import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Product } from '../calculation-logic/cart-types';
import { databases, config } from '../calculation-logic/appwriteConfig';
import { LocalisationUser } from '../calculation-logic/calculLivraison';
import { useAppTranslation } from '../translations/data/translationCentralization';

declare var process: {
  env: {
    BREVO_API_KEY: string;
    BREVO_FROM_EMAIL: string;
    RESEND_API_KEY: string;
    RESEND_FROM_EMAIL: string;
    ONESIGNAL_APP_ID: string;
    ONESIGNAL_REST_API_KEY: string;
    [key: string]: string | undefined;
  };
};

interface DeliveryConfirmationProps {
  products: Product[];
  userLocation: LocalisationUser;
  MC: number;
  orderReference: string;
  qrData: string;
}
const DeliveryConfirmation = ({
  products,
  userLocation,
  MC,
  orderReference,
  qrData,
}: DeliveryConfirmationProps) => {

  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useAppTranslation();

  const deliveryInfo = {
    price: MC,
    clientEmail: userLocation?.username || '',
    fullName: userLocation?.fullName || 'Client',
    address: userLocation?.address || '',
    orderReference: orderReference
  };
  const totalProductsCount = products.reduce((sum, product) => sum + (product.valeurQuantite || 0), 0);
  const totalCommand = products.reduce((sum, product) => sum + (product.prix * (product.valeurQuantite || 0)), 0);
  const finalTotal = totalCommand + deliveryInfo.price;

  const BREVO_CONFIG = {
    apiKey: process.env.BREVO_API_KEY,
    fromEmail: process.env.BREVO_FROM_EMAIL
  };
  const RESEND_CONFIG = {
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.RESEND_FROM_EMAIL
  };

  const generateEmailBody = (qrData: string) => {
    let body = `Taqvaylit\n`;
    body += `AKONFIRMI N USAWEḌ\n========================\n\n`;
    body += `Référence: ${deliveryInfo.orderReference}\n`;
    body += `Sɣur: ${deliveryInfo.fullName}\n`;
    body += `Tansa: ${deliveryInfo.address}\n\n`;
    body += `AYEN I YELLAN DI LQEḌYAN\n==================\n\n`;

    products.forEach((product) => {
      body += `${product.name}\n`;
      body += `  - Acḥal/Ableɣ(volume)/Lmizan: ${product.valeurQuantite}\n`;
      body += `  - Ssuma n usafar: ${product.prix.toFixed(2)}DZD\n`;
      body += `  - Ssuma: ${(product.prix * (product.valeurQuantite || 0)).toFixed(2)}DZD\n`;
      body += `  - Taḥanuţ: ${product.storeId}\n\n`;
    });

    body += `ASEGZI\n=============\n\n`;
    body += `Acḥal n tɣawsiwin akk id teqḍiḍ: ${totalProductsCount}\n`;
    body += `Ssuma n wayen id teqḍiḍ: ${totalCommand.toFixed(2)}DZD\n`;
    body += `Ssuma n usaweḍ: ${deliveryInfo.price.toFixed(2)}DZD\n`;
    body += `Ssuma taneggarut ara txellṣeḍ: ${finalTotal.toFixed(2)}DZD\n\n`;
    body += `Yeţwaxelleṣ lqeḍyan?: ${isPaid ? 'YEŢWAXELLEṢ' : 'UR YEŢWAXELLEṢ ARA'}\n\n`;

    body += `ASTENYI S QR\n======================\n\n`;
    body += `QR yeţwaskanin: ${qrData}\n`;
    body += `Ass d saɛa: ${new Date().toLocaleString('fr-FR')}\n`;
    body += `Hash n tmeẓriwt: ${generateHash(qrData)}\n\n`;

    body += `Arrat-agi yeţwaxdamed akken ad yesevgen d akken win yuɣen yeppʷeḍ-as-d lqeḍyan id yuɣ ɣer ufus-is.\n\n`;

    body += `\n========================================\n\n`;

    body += `Français\n`;
    body += `CONFIRMATION DE LIVRAISON\n========================\n\n`;
    body += `Référence: ${deliveryInfo.orderReference}\n`;
    body += `Par: ${deliveryInfo.fullName}\n`;
    body += `Adresse: ${deliveryInfo.address}\n\n`;
    body += `PRODUCTS COMMANDÉS\n==================\n\n`;

    products.forEach((product) => {
      body += `${product.name}\n`;
      body += `  - Quantité/Volume/Poids: ${product.valeurQuantite}\n`;
      body += `  - Prix du product: ${product.prix.toFixed(2)}DZD\n`;
      body += `  - Montant: ${(product.prix * (product.valeurQuantite || 0)).toFixed(2)}DZD\n`;
      body += `  - Store: ${product.storeId}\n\n`;
    });

    body += `RÉCAPITULATIF\n=============\n\n`;
    body += `Nombre total de products: ${totalProductsCount}\n`;
    body += `Total des products: ${totalCommand.toFixed(2)}DZD\n`;
    body += `Frais de livraison: ${deliveryInfo.price.toFixed(2)}DZD\n`;
    body += `Total final: ${finalTotal.toFixed(2)}DZD\n\n`;
    body += `Statut paiement: ${isPaid ? 'PAYÉ' : 'NON PAYÉ'}\n\n`;

    body += `SIGNATURE ÉLECTRONIQUE\n======================\n\n`;
    body += `Code QR scanné: ${qrData}\n`;
    body += `Date et heure: ${new Date().toLocaleString('fr-FR')}\n`;
    body += `Hash de vérification: ${generateHash(qrData)}\n\n`;

    body += `Ce document confirme la réception de la commande par le client.\n`;

    return body;
  };

  const generateHash = (data: string) => {
    const timestamp = new Date().getTime();
    const combined = `${data}-${deliveryInfo.orderReference}-${timestamp}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).toUpperCase();
  };

  const sendWithResend = async (qrData: string) => {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_CONFIG.fromEmail,
        to: deliveryInfo.clientEmail,
        subject: `Confirmation de livraison - ${deliveryInfo.orderReference}`,
        text: generateEmailBody(qrData),
      }),
    });
    if (!response.ok) throw new Error('Erreur Resend');
  };

  const sendWithOneSignal = async (qrData: string) => {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,
        include_email_tokens: [deliveryInfo.clientEmail],
        email_subject: `Confirmation de livraison - ${deliveryInfo.orderReference}`,
        email_body: generateEmailBody(qrData).replace(/\n/g, '<br>'),
      }),
    });
    if (!response.ok) throw new Error('Erreur OneSignal');
  };

  const sendConfirmationEmail = async (qrData: string) => {
    try {
      setIsProcessing(true);

      const usersList = await databases.listDocuments(config.databaseId, config.usersCollectionId, []);
      const totalContacts = usersList.total;

      const terminerCommande = async () => {
        await databases.updateDocument(config.databaseId, config.deliveriesCollectionId, deliveryInfo.orderReference, { status: 'DELIVERED' });
      };

      if (totalContacts <= 2000) {
        const responseBrevo = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { 'accept': 'application/json', 'api-key': BREVO_CONFIG.apiKey || '', 'content-type': 'application/json' },
          body: JSON.stringify({
            sender: { email: BREVO_CONFIG.fromEmail },
            to: [{ email: deliveryInfo.clientEmail }],
            subject: `Confirmation de livraison - ${deliveryInfo.orderReference}`,
            textContent: generateEmailBody(qrData),
          }),
        });

        if (responseBrevo.ok) {
          console.log("Reçu envoyé via Brevo.");
          await terminerCommande();
        } else {
          console.error("Brevo a planté, OneSignal prend le relais...");
          await sendWithOneSignal(qrData);
          await terminerCommande();
        }
      } else {
        try {
          await sendWithResend(qrData);
          console.log("Reçu envoyé via Resend.");
          await terminerCommande();
        } catch (resendError) {
          console.error("Resend est bloqué (quota dépassé), OneSignal prend le relais...");
          await sendWithOneSignal(qrData);
          await terminerCommande();
        }
      }
    } catch (error) {
      console.error("Désastre total, la cascade a échoué :", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('confirmaLiv')}</Text>

      {products.map((product) => (
        <View key={product.id} style={styles.productItem}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productDetails}>{t('qntVolPds')}: {product.valeurQuantite} {product.uniteQuantite}</Text>
          <Text style={styles.productDetails}>{t('commandsMgz.unitPrice')}: {product.prix} DZD</Text>
        </View>
      ))}
      <View style={styles.deliverySection}>
        <Text style={styles.deliveryText}>{t('delivery_cost_label')}: {deliveryInfo.price.toFixed(2)} DZD</Text>
        <Text style={styles.totalText}>
          {t('finalTotal')}: {finalTotal.toFixed(2)} DZD
        </Text>
      </View>
      {isPaid === null && (
        <View style={styles.paymentSection}>
          <Text style={styles.paymentQuestion}> {t('commandePayee?')}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => { setIsPaid(true); sendConfirmationEmail(qrData); }}
            >
              <Text style={styles.buttonText}>{t('general.yes')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setIsPaid(false)}
            >
              <Text style={styles.buttonText}>{t('general.no')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  productItem: {
    marginBottom: 15,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
  },
  productDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  totalSection: {
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  cameraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#000',
    fontSize: 16,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 4,
  },
  deliverySection: {
    padding: 10,
  },
  deliveryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  paymentSection: {
    marginTop: 5,
    padding: 10,
  },
  paymentQuestion: {
    fontSize: 16,
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 100,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  qrSection: {
    marginTop: 10,
    alignItems: 'center',
    padding: 20,
    marginBottom: 100,
  },
  cameraIcon: {
    width: 48,
    height: 48,
  },
  qrText: {
    fontSize: 16,
    marginTop: 10,
  },
});

export default DeliveryConfirmation;
