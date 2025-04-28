import React from 'react';

function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
        <p className="mb-3">
          Welcome to DuoBook. By accessing or using our application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
        </p>
        <p className="mb-3">
          These Terms constitute a legally binding agreement between you and DuoBook regarding your use of our language learning application and services.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">2. Service Description</h2>
        <p className="mb-3">
          DuoBook is a language learning platform that provides AI-generated bilingual stories to help users practice reading in different languages. Our services may include, but are not limited to:
        </p>
        <ul className="list-disc pl-6 mb-3">
          <li>Generation of custom stories based on user prompts</li>
          <li>Bilingual text presentation with vocabulary assistance</li>
          <li>Text-to-speech functionality for language pronunciation</li>
          <li>User account management for saving stories</li>
        </ul>
        <p className="mb-3">
          We reserve the right to modify, suspend, or discontinue any part of our service at any time without prior notice.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">3. User Accounts and Registration</h2>
        <p className="mb-3">
          Some features of DuoBook require you to create a user account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate and complete.
        </p>
        <p className="mb-3">
          You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">4. User Content and Conduct</h2>
        <p className="mb-3">
          When you submit prompts, descriptions, or other content to generate stories, you retain ownership of your content. However, you grant DuoBook a worldwide, non-exclusive, royalty-free license to use, store, and process this content for the purpose of providing our services.
        </p>
        <p className="mb-3">
          You agree not to use our services to:
        </p>
        <ul className="list-disc pl-6 mb-3">
          <li>Generate content that is illegal, harmful, threatening, abusive, or otherwise objectionable</li>
          <li>Infringe upon the intellectual property rights of others</li>
          <li>Attempt to gain unauthorized access to any part of our services</li>
          <li>Use our services for any commercial purpose without our consent</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">5. Intellectual Property</h2>
        <p className="mb-3">
          The DuoBook application, including its design, text, graphics, interfaces, and code, is protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of our services without our explicit permission.
        </p>
        <p className="mb-3">
          The AI-generated stories created through our service are provided for personal educational use. You may save and use these stories for your personal language learning, but you may not redistribute or commercialize them without permission.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">6. Third-Party Services</h2>
        <p className="mb-3">
          Our service may integrate with third-party services such as OpenAI for content generation and Firebase for user authentication. Your use of these third-party services is subject to their respective terms and privacy policies.
        </p>
        <p className="mb-3">
          We are not responsible for the content, privacy policies, or practices of any third-party services that may be linked to or integrated with our application.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">7. Disclaimer of Warranties</h2>
        <p className="mb-3">
          DuoBook provides its services on an "as is" and "as available" basis. We make no warranties, expressed or implied, regarding the accuracy, reliability, or quality of our services, including the accuracy of translations or educational content.
        </p>
        <p className="mb-3">
          We do not guarantee that our services will be uninterrupted, secure, or error-free, or that defects will be corrected.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">8. Limitation of Liability</h2>
        <p className="mb-3">
          To the maximum extent permitted by law, DuoBook shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use our services.
        </p>
        <p className="mb-3">
          In no event shall our total liability to you for all claims exceed the amount you paid us, if any, for accessing our services during the twelve months prior to such claim.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">9. Termination</h2>
        <p className="mb-3">
          We may terminate or suspend your access to our services immediately, without prior notice or liability, for any reason, including if you breach these Terms of Service.
        </p>
        <p className="mb-3">
          Upon termination, your right to use our services will immediately cease, but all provisions of these Terms which by their nature should survive termination shall survive.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">10. Changes to Terms</h2>
        <p className="mb-3">
          We reserve the right to modify these Terms at any time. We will provide notice of significant changes by updating the date at the top of these Terms and potentially via email for registered users.
        </p>
        <p className="mb-3">
          Your continued use of our services after such modifications constitutes your acceptance of the revised Terms.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">11. Governing Law</h2>
        <p className="mb-3">
          These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which DuoBook is established, without regard to its conflict of law provisions.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-3">12. Contact Information</h2>
        <p className="mb-3">
          If you have any questions about these Terms, please contact us at support@duobook.co.
        </p>
      </section>

      <p className="text-sm text-muted-foreground italic mt-8">
        Last updated: April 2025
      </p>
    </div>
  );
}

export default TermsOfService; 