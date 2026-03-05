import { google } from 'googleapis';
import { Logger } from '@nestjs/common';

const logger = new Logger('GooglePlayVerification');

export interface PurchaseVerificationResult {
  isValid: boolean;
  orderId?: string;
  purchaseTime?: number;
  purchaseState?: number;
  consumptionState?: number;
  error?: string;
}

export interface SubscriptionVerificationResult {
  isValid: boolean;
  startTime?: number;
  expiryTime?: number;
  autoRenewing?: boolean;
  paymentState?: number;
  error?: string;
}

class GooglePlayVerificationService {
  private androidPublisher: any = null;
  private packageName: string;

  constructor() {
    this.packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME ?? 'com.buzz.app';
  }

  /**
   * Initialize Google Play API client
   */
  private async getAndroidPublisher() {
    if (this.androidPublisher) {
      return this.androidPublisher;
    }

    try {
      // Check if service account credentials exist
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      if (!credentialsPath) {
        logger.warn('GOOGLE_APPLICATION_CREDENTIALS not set - verification disabled');
        return null;
      }

      // Authenticate with service account
      const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/androidpublisher'],
      });

      const authClient = await auth.getClient();

      // Create Android Publisher API client
      this.androidPublisher = google.androidpublisher({
        version: 'v3',
        auth: authClient as any,
      });

      logger.log('✅ Google Play API client initialized');
      return this.androidPublisher;
    } catch (error: any) {
      logger.error('❌ Failed to initialize Google Play API client:', error?.message ?? error);
      return null;
    }
  }

  /**
   * Verify a product purchase (coins)
   */
  async verifyProductPurchase(
    productId: string,
    purchaseToken: string,
  ): Promise<PurchaseVerificationResult> {
    try {
      const publisher = await this.getAndroidPublisher();

      if (!publisher) {
        // Verification disabled - accept all purchases in development
        logger.warn('⚠️ Purchase verification disabled - accepting purchase');
        return {
          isValid: true,
          orderId: 'dev_' + Date.now(),
          purchaseTime: Date.now(),
          purchaseState: 0, // Purchased
          consumptionState: 0, // Yet to be consumed
        };
      }

      // Call Google Play Developer API
      const response = await publisher.purchases.products.get({
        packageName: this.packageName,
        productId: productId,
        token: purchaseToken,
      });

      const purchase = response.data;

      // Check if purchase is valid
      const isValid = purchase.purchaseState === 0; // 0 = Purchased, 1 = Canceled

      if (isValid) {
        logger.log(`✅ Purchase verified: ${productId}, orderId: ${purchase.orderId ?? 'unknown'}`);
      } else {
        logger.warn(`❌ Purchase invalid: ${productId}, state: ${purchase.purchaseState ?? 'unknown'}`);
      }

      return {
        isValid,
        orderId: purchase.orderId,
        purchaseTime: purchase.purchaseTimeMillis ? parseInt(purchase.purchaseTimeMillis) : undefined,
        purchaseState: purchase.purchaseState,
        consumptionState: purchase.consumptionState,
      };
    } catch (error: any) {
      logger.error('❌ Purchase verification failed:', error?.message ?? error);
      return {
        isValid: false,
        error: error?.message ?? 'Verification failed',
      };
    }
  }

  /**
   * Verify a subscription purchase (premium)
   */
  async verifySubscriptionPurchase(
    subscriptionId: string,
    purchaseToken: string,
  ): Promise<SubscriptionVerificationResult> {
    try {
      const publisher = await this.getAndroidPublisher();

      if (!publisher) {
        // Verification disabled - accept all subscriptions in development
        logger.warn('⚠️ Subscription verification disabled - accepting subscription');
        const now = Date.now();
        const oneMonth = 30 * 24 * 60 * 60 * 1000;
        return {
          isValid: true,
          startTime: now,
          expiryTime: now + oneMonth,
          autoRenewing: true,
          paymentState: 1, // Payment received
        };
      }

      // Call Google Play Developer API
      const response = await publisher.purchases.subscriptions.get({
        packageName: this.packageName,
        subscriptionId: subscriptionId,
        token: purchaseToken,
      });

      const subscription = response.data;

      // Check if subscription is active
      const now = Date.now();
      const expiryTime = subscription.expiryTimeMillis ? parseInt(subscription.expiryTimeMillis) : 0;
      const isValid = expiryTime > now && subscription.paymentState === 1;

      if (isValid) {
        logger.log(`✅ Subscription verified: ${subscriptionId}, expires: ${new Date(expiryTime).toISOString()}`);
      } else {
        logger.warn(`❌ Subscription invalid: ${subscriptionId}, expired or not paid`);
      }

      return {
        isValid,
        startTime: subscription.startTimeMillis ? parseInt(subscription.startTimeMillis) : undefined,
        expiryTime: subscription.expiryTimeMillis ? parseInt(subscription.expiryTimeMillis) : undefined,
        autoRenewing: subscription.autoRenewing ?? false,
        paymentState: subscription.paymentState,
      };
    } catch (error: any) {
      logger.error('❌ Subscription verification failed:', error?.message ?? error);
      return {
        isValid: false,
        error: error?.message ?? 'Verification failed',
      };
    }
  }

  /**
   * Acknowledge a purchase (required by Google Play to prevent refund)
   */
  async acknowledgePurchase(productId: string, purchaseToken: string): Promise<boolean> {
    try {
      const publisher = await this.getAndroidPublisher();

      if (!publisher) {
        logger.warn('⚠️ Purchase acknowledgment disabled');
        return true;
      }

      await publisher.purchases.products.acknowledge({
        packageName: this.packageName,
        productId: productId,
        token: purchaseToken,
      });

      logger.log(`✅ Purchase acknowledged: ${productId}`);
      return true;
    } catch (error: any) {
      logger.error('❌ Purchase acknowledgment failed:', error?.message ?? error);
      return false;
    }
  }

  /**
   * Acknowledge a subscription
   */
  async acknowledgeSubscription(subscriptionId: string, purchaseToken: string): Promise<boolean> {
    try {
      const publisher = await this.getAndroidPublisher();

      if (!publisher) {
        logger.warn('⚠️ Subscription acknowledgment disabled');
        return true;
      }

      await publisher.purchases.subscriptions.acknowledge({
        packageName: this.packageName,
        subscriptionId: subscriptionId,
        token: purchaseToken,
      });

      logger.log(`✅ Subscription acknowledged: ${subscriptionId}`);
      return true;
    } catch (error: any) {
      logger.error('❌ Subscription acknowledgment failed:', error?.message ?? error);
      return false;
    }
  }
}

export const googlePlayVerification = new GooglePlayVerificationService();
