import fetch from 'node-fetch';
import { Client, Databases } from 'node-appwrite';
import { calculateur, LocalisationUser, Driver } from '../app/(main)/calculation-logic/calculLivraison';

declare var process: {
  env: {
    APPWRITE_ENDPOINT: string;
    APPWRITE_FUNCTION_PROJECT_ID: string;
    APPWRITE_API_KEY: string;
    DATABASE_ID: string;
    USERS_COLLECTION_ID: string;
    ONESIGNAL_REST_API_KEY: string;
    ONESIGNAL_APP_ID: string;
    BREVO_API_KEY: string;
    BREVO_FROM_EMAIL: string;
    RESEND_API_KEY: string;
    RESEND_FROM_EMAIL: string;
    [key: string]: string | undefined;
  };
};

interface AppwriteContext {
  req: { body: string | Record<string, unknown>;[key: string]: unknown };
  res: {
    send: (text: string, status?: number) => void;
    json: (obj: Record<string, unknown>, status?: number) => void;
  };
  log: (msg: string) => void;
  error: (msg: string) => void;
}

export default async ({ req, res }: AppwriteContext) => {
  const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const envoyerPushOneSignal = async (userIds: string[], heading: string, content: string, extraData?: any) => {
    const payload: any = {
      app_id: process.env.ONESIGNAL_APP_ID,
      include_external_user_ids: userIds,
      headings: { "en": heading, "fr": heading },
      contents: { "en": content, "fr": content },
    };

    // Si c'est la sirène, on ajoute les priorités et sons
    if (data.action === 'sirene') {
      payload.priority = 10;
      payload.android_channel_id = "urgence_livraison";
      payload.android_sound = "sirene";
      payload.ios_sound = "sirene.wav";
    }

    if (extraData) payload.data = extraData;

    await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(payload)
    });
  };

  switch (data.action) {
    // ==========================================
    // 1. LA SIRÈNE 500M (Urgence Livraison)
    // ==========================================
    case 'sirene':
      const distance = calculateur.dis(
        { localisation_gps: data.clientGPS } as LocalisationUser,
        { location_liv: data.driverGPS } as Driver
      );

      if (distance <= 0.5) {
        await envoyerPushOneSignal(
          [data.userIdDuClient],
          "🚨 ATAYA LQEḌYAN 🚨",
          "Win ara d yesawḍen lqeḍyan-ik/im atan 500 lmitrat seg uxxam! Heggi-d ad tid ṭṭefeḍ."
        );
      }
      return res.json({ success: true, message: "Sirène traitée" });
    case 'story_store':
      await envoyerPushOneSignal(
        data.userIds,
        `${data.nomStore} 🏪 terra-d tugna ! `,
        "Yya-d ad twaliḍ tugna id erra tḥanuţ uqvel ad tekkes.",
        { type: "STORY", storeId: data.storeId }
      );
      return res.json({ success: true, message: "Notification story envoyée" });
    case 'promo_product':
      await envoyerPushOneSignal(
        data.userIds,
        `🔥Promotion! Promotion!! ${data.productName} !`,
        `Le prix passe de ${data.ancienPrix} DA à ${data.nouveauPrix} DA. Profites-en vite !`,
        { type: "PROMO", productId: data.productId }
      );
      return res.json({ success: true, message: "Notification promo envoyée" });

    // ==========================================
    // 4. L'AVALANCHE EMAILS (Confirmation)
    // ==========================================
    case 'avalanche':
      const { emailClient, orderReference, htmlContent } = data;

      const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

      const databases = new Databases(client);

      try {
        const usersList = await databases.listDocuments(process.env.DATABASE_ID, process.env.USERS_COLLECTION_ID, []);
        const totalContacts = usersList.total;

        const sendOneSignalFallback = async () => {
          const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}` },
            body: JSON.stringify({
              app_id: process.env.ONESIGNAL_APP_ID,
              include_email_tokens: [emailClient],
              email_subject: `Confirmation de livraison - ${orderReference}`,
              email_body: htmlContent
            })
          });
          if (!response.ok) throw new Error("OneSignal Error");
        };

        if (totalContacts <= 2000) {
          try {
            const resBrevo = await fetch('https://api.brevo.com/v3/smtp/email', {
              method: 'POST',
              headers: { 'accept': 'application/json', 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json' },
              body: JSON.stringify({
                sender: { email: process.env.BREVO_FROM_EMAIL },
                to: [{ email: emailClient }],
                subject: `Confirmation de livraison - ${orderReference}`,
                htmlContent: htmlContent
              })
            });
            if (!resBrevo.ok) throw new Error("Brevo Error");
            return res.json({ success: true, via: "Brevo" });
          } catch (err) {
            await sendOneSignalFallback();
            return res.json({ success: true, via: "OneSignal Fallback" });
          }
        } else {
          try {
            const resResend = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                from: process.env.RESEND_FROM_EMAIL,
                to: [emailClient],
                subject: `Confirmation de livraison - ${orderReference}`,
                html: htmlContent
              })
            });
            if (!resResend.ok) throw new Error("Resend Error");
            return res.json({ success: true, via: "Resend" });
          } catch (err) {
            await sendOneSignalFallback();
            return res.json({ success: true, via: "OneSignal Fallback" });
          }
        }
      } catch (finalError) {
        return res.json({ success: false, error: "Echec total" }, 500);
      }

    default:
      return res.json({ success: false, error: "Action non reconnue" }, 400);
  }
};
