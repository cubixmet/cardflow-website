"use client";

import React from "react";
import { FileText } from "lucide-react";
import { useBranding } from "@/components/branding-provider";

export default function Terms() {
  const { brandSettings } = useBranding();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
          <FileText className="w-3.5 h-3.5" /> Terms
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Terms of Service
        </h1>
        <p className="text-sm text-muted">
          {brandSettings.platform_name} by {brandSettings.company_name}
        </p>
      </div>
      
      <div className="prose dark:prose-invert max-w-none border border-card-border bg-card-bg/30 rounded-2xl p-8 sm:p-12 space-y-6 text-sm text-muted leading-relaxed">
        <p>
          Welcome to {brandSettings.platform_name}. By accessing or using our services, you agree to comply with and be bound by the following Terms of Service.
        </p>
        
        <h2 className="text-lg font-bold text-foreground mt-6">1. User Accounts and Account Security</h2>
        <p>
          You must maintain the confidentiality of your credentials. You are responsible for all activities occurring under your account. You agree to notify us immediately of any unauthorized use of your account.
        </p>
        
        <h2 className="text-lg font-bold text-foreground mt-6">2. Permitted Use</h2>
        <p>
          You may use our platform solely for lawful purposes associated with managing ID cards and printing operations. You agree not to upload fraudulent data, unauthorized profiles, or malicious code.
        </p>
        
        <h2 className="text-lg font-bold text-foreground mt-6">3. Wallet Credits and Billing</h2>
        <p>
          Wallet credits purchased on our platform are non-refundable and hold no monetary value outside the {brandSettings.platform_name} ecosystem. Purchases and transactions are final unless required by law.
        </p>
        
        <h2 className="text-lg font-bold text-foreground mt-6">4. Intellectual Property</h2>
        <p>
          The designs, layout variable compilers, and all visual materials developed on this site belong to {brandSettings.company_name} and are protected under copyright laws.
        </p>

        <h2 className="text-lg font-bold text-foreground mt-6">5. Optional Google Drive storage</h2>
        <p>
          A studio owner or admin may connect a Google account so organisation card photos are stored in that account’s Google Drive. Connecting Drive is optional. If it is not connected, photos stay in platform file storage.
        </p>
        <p>
          You are responsible for the Google account you connect, for having the right to store card-holder photographs there, and for complying with Google’s terms. {brandSettings.platform_name} uses that connection only to create, read, and manage the photo files the app places in Drive, and to check available storage space. We do not take ownership of your Google account.
        </p>
        <p>
          Disconnecting Drive returns new photo uploads to platform file storage. Photos already saved in Google Drive remain in that Google account. We do not copy them back to platform storage and we do not delete them from Drive only because the connection was removed. If you delete a card holder or level in the product, the related photos are removed from the store that currently holds them.
        </p>
        <p>
          Downloads and file names are produced from the card-holder and level details in {brandSettings.platform_name}. Storing a photo in Google Drive does not change those download features or naming rules.
        </p>

        <h2 className="text-lg font-bold text-foreground mt-6">6. User-Uploaded Content and Licensing</h2>
        <p>
          If you use {brandSettings.platform_name} Studio to upload fonts, designs, images, logos, or other creative assets, you are solely responsible for ensuring that you have the right to use and distribute that content—including any required licenses, permissions, or third-party approvals.
        </p>
        <p>
          You represent and warrant that your uploads do not infringe any copyright, trademark, design right, font license, or other intellectual property right of any third party. {brandSettings.company_name} and {brandSettings.platform_name} do not review uploaded content for licensing compliance and will not be responsible or liable for any license dispute, claim, penalty, or loss arising from content you or your team uploads, selects, or applies within the platform.
        </p>
      </div>
    </div>
  );
}
