export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground">
        Home Express collects and processes your data to operate the platform, fulfill bookings,
        and improve the service. We keep your data secure and do not sell it to third parties.
      </p>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">What we collect</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Account details such as name, email, phone, and role.</li>
          <li>Booking information, addresses, and payment-related metadata.</li>
          <li>Usage analytics to improve performance and reliability.</li>
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Your controls</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Update or correct your profile data in the app.</li>
          <li>Request deletion of your account where applicable.</li>
          <li>Opt out of non-essential communications.</li>
        </ul>
      </section>
      <p className="text-muted-foreground">
        For questions or requests, email privacy@homeexpress.vn. By using the service, you consent
        to this policy.
      </p>
    </main>
  )
}
