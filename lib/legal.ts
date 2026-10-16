/** Central legal metadata for the public website. Apps should link here, not copy policy text. */

export const PLATFORM_NAME = "Z Cards";
export const OPERATOR_NAME = "Cubixmet LLP";
export const OPERATOR_URL = "https://www.cubixmet.com";
export const PRIVACY_PATH = "/privacy";
export const PRIVACY_EFFECTIVE_DATE = "13 August 2026";
export const PRIVACY_LAST_UPDATED = "17 October 2026";
export const PRIVACY_CONTACT_EMAIL = "info@zamirzac.com";
export const PRIVACY_CONTACT_PHONE = "+91 88916 33035";
export const PRIVACY_CONTACT_ADDRESS = "Zamirzac Solutions, Calicut, Kerala, India";

export type PolicySection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const PRIVACY_SECTIONS: PolicySection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    paragraphs: [
      `${PLATFORM_NAME} is an ID card management and printing platform operated for studios, organisations, and their authorised users. This Privacy & Policy explains what information we handle, how it is used, how long it is kept, and how you can ask us about it.`,
      `This page is the single public policy for ${PLATFORM_NAME}, including the public website, Studio, organisation dashboard, mobile app, and related services. If we update it, the latest version is always published here.`,
    ],
  },
  {
    id: "data-collection",
    title: "Data we collect",
    paragraphs: [
      "We collect information that is needed to create accounts, run organisations and studios, produce ID cards, and keep the service secure. The details depend on how you use the platform.",
    ],
    bullets: [
      "Account details you provide: name, email address, phone number, password (stored as a hash, not in plain text), timezone, and language preference.",
      "Studio and organisation details: business or school name, contacts, addresses, tax identifiers where you choose to add them, branding, and workspace settings.",
      "Card-holder records that authorised users upload or generate: names and other template fields, photographs, signatures, documents, and related approval or print history.",
      "Usage and security data created by the service: sign-in attempts, session records, device or client type, IP address, and user agent, used to authenticate you and investigate abuse.",
      "Support and website messages: name, email, phone, and the content of contact forms, demo requests, or tickets you send us.",
      `Billing information related to studio credits or purchases, processed as needed to record payments and issue invoices. Card numbers are not stored in the ${PLATFORM_NAME} application database when a payment provider is used.`,
    ],
  },
  {
    id: "data-usage",
    title: "How we use data",
    paragraphs: [
      "We use the information above to operate the product you signed up for — not to sell personal data.",
    ],
    bullets: [
      "Provide sign-in, account management, organisation and studio workspaces, card design, imports, approvals, downloads, and printing workflows.",
      "Send transactional messages such as email verification, magic links, password resets, and credential notices that you or an administrator requested.",
      "Protect accounts (for example failed-login lockouts, session expiry, and alerts about suspicious refresh-token reuse).",
      "Respond to support requests and operate the public website, including contact and demo forms.",
      "Meet legal, accounting, or security obligations where we are required to retain records.",
    ],
  },
  {
    id: "storage-retention",
    title: "Storage and retention",
    paragraphs: [
      "Application data is stored in our hosted databases and file storage used by the platform. Photos, signatures, designs, and documents are kept as files referenced by your workspace records.",
      "A studio owner or admin can optionally connect a Google account so organisation card photos are stored in that account’s Google Drive instead of platform file storage. See “Google Drive” below. Designs, fonts, invoices, logos, and signatures stay on platform file storage.",
      "We retain active workspace data for as long as the studio or organisation account needs it to run ID card workflows. We do not use a hidden local database on your device as the source of truth for business records; apps may cache data temporarily for offline or performance use.",
      "When an account is deleted, we do not permanently erase historical workflow data. See “Account deletion” below.",
    ],
  },
  {
    id: "google-drive",
    title: "Google Drive",
    paragraphs: [
      "Connecting Google Drive is optional. Only a studio owner or admin can connect or disconnect it. The connection is for the studio, and each organisation’s photos are placed in a separate folder.",
      "We ask Google for permission to see the account email, create and manage files that this app creates, and read storage space on that Drive. We do not ask for access to the rest of the Google account’s files. The refresh token that lets the app open those files later is encrypted before it is stored on our servers. We do not store Google passwords.",
      "When Drive is connected, new card photos and image fields for an organisation using Drive are saved under a folder named ZCards, then the studio, the organisation, the level, and the field. A studio can also move existing card photos into that structure. Moving a photo copies it, checks that the copy matches, and then removes the platform copy. Downloads, previews, and file names continue to use the card-holder details you already set in the product.",
      "Disconnecting Drive stops new photos from being saved there. Later uploads use platform file storage again. Photos already in Google Drive stay in the studio’s Google account. We do not copy them back, and we do not delete them from Drive because the account was disconnected. Deleting a card holder or level in the product still removes that holder’s photos from whichever store currently has them, including Google Drive, when the connection can still open those files.",
      "Google’s own terms and privacy policy apply to the Google account a studio connects. The studio is responsible for choosing an account that is allowed to store the photographs and for keeping that Google account in good standing.",
    ],
  },
  {
    id: "account-deletion",
    title: "Account deletion",
    paragraphs: [
      "You can delete your own login from Profile or Settings in the organisation apps and Studio. Administrators can also remove organisation users from the workspace.",
      "Deletion is a soft delete. From your point of view the account is gone: you cannot sign in, unused magic or reset links stop working, and the user no longer appears as an active member in the live interface.",
      "We keep the underlying user record and related workflow history (for example who created or updated a card holder) so existing cards, levels, and audit references continue to work. The same email can be invited or registered again later; in that case we restore the original account identity rather than creating a disconnected duplicate.",
      "The last organisation administrator cannot delete their account while other members remain, so a workspace is not left without an admin. Platform operator accounts are not self-deleted through the product.",
    ],
  },
  {
    id: "data-security",
    title: "Data security",
    paragraphs: [
      "We design the application so that signed-in features require authentication, sessions can be revoked, passwords are stored hashed, unused sign-in links expire, and deleted or deactivated accounts cannot obtain a new session.",
      "When you use the service over HTTPS, data in transit is encrypted by the connection. We apply access controls so users generally see the studios, organisations, and levels they are authorised to use.",
      "No online service can guarantee that data will never be accessed without authorisation. We do not claim specific third-party certifications, regulatory badges, or named encryption products on this page unless they are independently issued and verified.",
    ],
  },
  {
    id: "third-parties",
    title: "Third-party services",
    paragraphs: [
      "We use other companies only where needed to run the product. They process data on our instructions or as independent providers of a feature you use.",
    ],
    bullets: [
      "Email delivery for verification, magic links, password resets, and similar notices.",
      "Hosting, databases, and file storage that run the application.",
      "Payment or billing providers when credits or packages are purchased.",
      "Google Drive, only when a studio owner or admin connects a Google account so card photos can be stored in that Drive. Google then processes those files under its own terms.",
      "Maps or contact links on the public website (for example opening an address in Google Maps) if you choose to follow them.",
    ],
  },
  {
    id: "user-rights",
    title: "Your rights and requests",
    paragraphs: [
      "Depending on your role, you can view and update your profile, change your password, sign out of sessions, and delete your account as described above. Organisation and studio administrators manage membership, permissions, and card-holder data for their workspace.",
      `If you need a copy of your account information, a correction you cannot make in the product, or a discussion about deletion, email ${PRIVACY_CONTACT_EMAIL}. We may need to verify that the request comes from the account holder or an authorised administrator before we act on it.`,
    ],
  },
  {
    id: "cookies",
    title: "Cookies and similar storage",
    paragraphs: [
      "We use cookies, local storage, and similar technologies that are needed for the site and apps to work. Typical examples are keeping you signed in, remembering theme or studio selection, and storing a short-lived flag after you delete an account so we can show a confirmation on the next login screen.",
      "The public website and apps are not described here as using advertising trackers. If we add optional analytics or marketing cookies later, we will update this page before relying on them for that purpose.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    paragraphs: [
      `Privacy questions for ${PLATFORM_NAME} can be sent to ${PRIVACY_CONTACT_EMAIL} or by phone at ${PRIVACY_CONTACT_PHONE}.`,
      `Postal / studio location: ${PRIVACY_CONTACT_ADDRESS}.`,
      `The application is provided with security practices stated by ${OPERATOR_NAME} (${OPERATOR_URL}).`,
    ],
  },
];
