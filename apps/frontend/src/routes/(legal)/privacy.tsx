import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(legal)/privacy")({
  head: () => ({
    meta: [{ title: "Privacy Policy — Tea & Snacks" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="prose prose-slate mx-auto max-w-none dark:prose-invert">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Privacy Policy
        </h1>
        
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="mt-8 space-y-8 text-foreground/80">
          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">1. Introduction</h2>
            <p>
              At Tea & Snacks, we take your privacy seriously. This Privacy Policy outlines how we collect, use, and protect your personal information when you use our food ordering platform.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">2. Information We Collect</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li><strong>Personal Information:</strong> When you register or place an order, we collect your name, email address, and phone number to facilitate the ordering process.</li>
              <li><strong>Device Data:</strong> We may collect device tokens to send you push notifications regarding your order status.</li>
              <li><strong>Usage Data:</strong> We automatically collect basic analytical data regarding how you interact with our platform to improve our services.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">3. How We Use Your Information</h2>
            <p className="mb-2">We use the information we collect strictly to provide and improve our services to you:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>To process and fulfill your food orders.</li>
              <li>To send you transactional updates, such as order confirmations and delivery status (via push notifications or email).</li>
              <li>To provide customer support and handle any disputes or refunds.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">4. Data Sharing and Security</h2>
            <p className="mb-4">
              We do not sell your personal data to third parties. We only share necessary order details (like your name and order items) with the specific food vendor you are ordering from so they can prepare your food.
            </p>
            <p>
              We implement industry-standard security measures, including secure socket layer technology (SSL) and secure session management, to protect your personal information and payment details against unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">5. Your Rights</h2>
            <p>
              You have the right to access, update, or delete your personal information at any time. You can also opt-out of push notifications by disabling them in your notification settings or browser preferences. If you wish to permanently delete your account, please contact our support team.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">6. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy or how we handle your data, please contact us.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
