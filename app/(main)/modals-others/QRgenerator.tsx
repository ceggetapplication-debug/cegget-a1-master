import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import { databases, config } from '../calculation-logic/appwriteConfig';
import { useAppTranslation } from '../translations/data/translationCentralization';

export interface Order {
  id: string;
  orderReference: string;
  fullName: string;
  address: string;
  date: string;
}

export interface QRSignature {
  qrId: string;
  orderId: string;
  token: string;
  isValid: boolean;
  createdAt: number;
  usedAt?: number;
}

interface QRGeneratorProps {
  orderData: Order;
  externalDriverDistance: number | null;
  onSignatureCompleted?: () => void;
}


const QRgenerator: React.FC<QRGeneratorProps> = ({ orderData, externalDriverDistance, onSignatureCompleted }: QRGeneratorProps) => {
  const { t } = useAppTranslation();
  const [qrSignature, setQrSignature] = useState<QRSignature | null>(null);
  const [scanResult, setScanResult] = useState<string>('');
  const [signatureHistory, setSignatureHistory] = useState<QRSignature[]>([]);

  const generateQRCode = async () => {
    const orderIdToUse = orderData.orderReference || orderData.id || `temp-${Date.now()}`;
    const qrId = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const token = btoa(
      JSON.stringify({
        qrId,
        orderId: orderIdToUse,
        timestamp: Date.now(),
      })
    );

    const newQR: QRSignature = {
      qrId,
      orderId: orderIdToUse,
      token,
      isValid: true,
      createdAt: Date.now(),
    };

    setQrSignature(newQR);
    setSignatureHistory((prev: QRSignature[]) => [...prev, newQR]);
    setScanResult('');

    await databases.createDocument(
      config.databaseId,
      'signatures',
      qrId,
      newQR
    ).catch((err: any) => {
      console.error('Erreur sauvegarde signature:', err);
    });
    if (onSignatureCompleted) onSignatureCompleted();
  };

  useEffect(() => {
    if (externalDriverDistance !== null && externalDriverDistance <= 0.005 && !qrSignature) {
      generateQRCode();
    }
  }, [externalDriverDistance]);
  if (externalDriverDistance === null || externalDriverDistance > 0.005) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={styles.statusBar.barStyle} backgroundColor={styles.statusBar.backgroundColor} />

      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('signatureSQR')}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name={styles.iconPackage.name} size={styles.iconPackage.size} color={styles.iconPackage.color} />
            <Text style={styles.cardTitle}>{t('anwaIyughen')}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Icon name={styles.iconDocument.name} size={styles.iconPerson.size} color={styles.iconPerson.color} />
              <Text style={styles.infoLabel}>{t('commandList.reference')}</Text> <Text style={styles.infoValue}>{orderData.orderReference}</Text>
            </View>

          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Icon name={styles.iconPerson.name} size={styles.iconPerson.size} color={styles.iconPerson.color} />
              <Text style={styles.infoLabel}>{t('commandList.by')}</Text> <Text style={styles.infoValue}>{orderData.fullName}</Text>
            </View>


            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Icon name="location-sharp" size={styles.iconPerson.size} color={styles.iconPerson.color} />
                <Text style={styles.infoLabel}>{t('commandList.address')}</Text> <Text style={styles.infoValue}>{orderData.address}</Text>
              </View>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Icon name={styles.iconCalendar.name} size={styles.iconPerson.size} color={styles.iconPerson.color} />
              <Text style={styles.infoLabel}>{t('meymiDate')}</Text>: <Text style={styles.infoValue}>{orderData.date}</Text>
            </View>

          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name={styles.iconQr.name} size={styles.iconQr.size} color={styles.iconQr.color} />
            <Text style={styles.cardTitle}>{t('qrUstenyi')}</Text>
          </View>

          <View style={styles.qrContainer}>
            {qrSignature && (
              <QRCode
                value={qrSignature.token}
                size={styles.qrCode.size}
                backgroundColor={styles.qrCode.backgroundColor}
                color={qrSignature.isValid ? styles.qrCode.colorValid : styles.qrCode.colorInvalid}
              />
            )}
          </View>
          <View style={qrSignature?.isValid ? styles.statusValid : styles.statusInvalid}>
            <Icon
              name={qrSignature?.isValid ? styles.iconCheckCircle.name : styles.iconCloseCircle.name}
              size={styles.iconCheckCircle.size}
              color={qrSignature?.isValid ? styles.iconCheckCircle.color : styles.iconCloseCircle.color}
            />
            <Text style={qrSignature?.isValid ? styles.statusTextValid : styles.statusTextInvalid}>
              {qrSignature?.isValid ? t('qr.validCode') : t('qr.usedCode')}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.buttonGenerate}
              onPress={generateQRCode}
            >
              <Icon name={styles.iconRefresh.name} size={styles.iconRefresh.size} color={styles.iconRefresh.color} />
              <Text style={styles.buttonTextGenerate}>{t('QRajdid')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },
  statusBar: {
    barStyle: 'dark-content' as const,
    backgroundColor: '#f0f4ff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#001524',
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#fbfbfb',
    marginHorizontal: 10,
    marginBottom: 5,
    borderRadius: 5,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#001524',
    textDecorationLine: 'underline',
    textDecorationColor: '#ff7d00',
    marginLeft: 8,
    textDecorationThickness: 2,
  },
  infoRow: {
    marginBottom: 5,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 15,
    color: '#001524',
    fontWeight: 500,
    marginLeft: 6,
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    marginLeft: 6,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  qrCode: {
    size: 200,
    backgroundColor: '#ffffff',
    colorValid: '#001524',
    colorInvalid: '#15616d',
  },
  statusValid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 15,
    backgroundColor: '#001524',
    borderRadius: 5,
    marginBottom: 16,
    alignSelf: 'center',
    width: 'auto',
  },
  statusInvalid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 15,
    backgroundColor: '#ffecd1',
    borderRadius: 5,
    marginBottom: 16,
    alignSelf: 'center',
    width: 'auto',
  },
  statusTextValid: {
    fontSize: 15,
    fontWeight: 500,
    color: '#fff',
    marginLeft: 8,
  },
  statusTextInvalid: {
    fontSize: 15,
    fontWeight: 500,
    color: '#000',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  buttonGenerate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15616d',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignSelf: 'center',
    minWidth: 0,
    maxWidth: '70%',
    marginHorizontal: 'auto',
  },
  buttonTextGenerate: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 500,
    marginLeft: 8,
  },
  iconPackage: {
    name: 'cube-outline',
    size: 24,
    color: '#ff7d00',
  },
  iconDocument: {
    name: 'document-text-outline',
    size: 18,
    color: '#000',
  },
  iconPerson: {
    name: 'person-outline',
    size: 18,
    color: '#000',
  },
  iconCalendar: {
    name: 'calendar-outline',
    size: 18,
    color: '#000',
  },
  iconQr: {
    name: 'qr-code-outline',
    size: 24,
    color: '#ff7d00',
  },
  iconCheckCircle: {
    name: 'checkmark-circle',
    size: 24,
    color: '#fff',
  },
  iconCloseCircle: {
    name: 'close-circle',
    size: 24,
    color: '#fff',
  },
  iconRefresh: {
    name: 'refresh-outline',
    size: 20,
    color: '#ffffff',
  },
});

export default QRgenerator;
