import React from "react";

function PrivacyPolicy() {
	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

			<section className="mb-6">
				<h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
				<p className="mb-3">
					At DuoBook, we are committed to protecting your privacy. This Privacy
					Policy explains how we collect, use, disclose, and safeguard your
					information when you use our language learning application.
				</p>
				<p className="mb-3">
					Please read this Privacy Policy carefully. By accessing or using
					DuoBook, you acknowledge that you have read, understood, and agree to
					be bound by the terms of this Privacy Policy.
				</p>
			</section>

			<section className="mb-6">
				<h2 className="text-2xl font-semibold mb-3">
					2. Information We Collect
				</h2>
				<h3 className="text-xl font-medium mb-2">2.1 Personal Information</h3>
				<p className="mb-3">
					We may collect personal information that you voluntarily provide when
					creating an account or using our services, including:
				</p>
				<ul className="list-disc pl-6 mb-3">
					<li>Email address</li>
					<li>Username</li>
					<li>Password (stored in encrypted form)</li>
					<li>Profile information</li>
					<li>Language preferences</li>
				</ul>

				<h3 className="text-xl font-medium mb-2">2.2 Usage Data</h3>
				<p className="mb-3">
					We automatically collect certain information when you use our
					application, including:
				</p>
				<ul className="list-disc pl-6 mb-3">
					<li>Stories you generate and save</li>
					<li>Language pairs you select</li>
					<li>Your interactions with the application features</li>
					<li>Device information (type, operating system, browser)</li>
					<li>IP address and general location data</li>
					<li>Session duration and application usage patterns</li>
				</ul>

				<h3 className="text-xl font-medium mb-2">2.3 Content Data</h3>
				<p className="mb-3">
					The descriptions and prompts you provide to generate language learning
					stories are collected and processed to deliver our service.
				</p>
			</section>

			<section className="mb-6">
				<h2 className="text-2xl font-semibold mb-3">
					3. How We Use Your Information
				</h2>
				<p className="mb-3">
					We use the information we collect for various purposes, including:
				</p>
				<ul className="list-disc pl-6 mb-3">
					<li>Providing and maintaining our application</li>
					<li>Generating personalized language learning content</li>
					<li>Saving your stories and progress</li>
					<li>Improving and personalizing your experience</li>
					<li>Communicating with you about updates or changes</li>
					<li>Analyzing usage patterns to enhance our service</li>
					<li>Detecting and preventing fraudulent or unauthorized activity</li>
				</ul>
			</section>

			<section className="mb-6">
				<h2 className="text-2xl font-semibold mb-3">4. Third-Party Services</h2>
				<p className="mb-3">
					DuoBook uses third-party services that may collect information through
					our application:
				</p>
				<ul className="list-disc pl-6 mb-3">
					<li>
						<strong>Firebase:</strong> For user authentication and data storage.
						Firebase's privacy policy is available at{" "}
						<a
							href="https://firebase.google.com/support/privacy"
							className="text-blue-600 hover:underline"
						>
							https://firebase.google.com/support/privacy
						</a>
						.
					</li>
					<li>
						<strong>OpenAI:</strong> For generating language learning content
						based on your prompts. OpenAI's privacy policy is available at{" "}
						<a
							href="https://openai.com/policies/privacy-policy"
							className="text-blue-600 hover:underline"
						>
							https://openai.com/policies/privacy-policy
						</a>
						.
					</li>
				</ul>
				<p className="mb-3">
					We only share the information necessary for these services to function
					properly and provide the DuoBook experience.
				</p>
			</section>

			<section className="mb-6">
				<h2 className="text-2xl font-semibold mb-3">
					5. Data Storage and Security
				</h2>
				<p className="mb-3">
					We implement appropriate technical and organizational measures to
					protect your personal information from unauthorized access, loss, or
					alteration. However, no method of transmission over the Internet or
					electronic storage is 100% secure.
				</p>
				<p className="mb-3">
					Your stories and account data are stored securely in Firebase's cloud
					infrastructure. We retain your data for as long as your account is
					active or as needed to provide our services. You can request deletion
					of your account and associated data at any time.
				</p>
			</section>

			<section className="mb-6">
				<h2 className="text-2xl font-semibold mb-3">6. Your Data Rights</h2>
				<p className="mb-3">
					Depending on your location, you may have certain rights regarding your
					personal information, including:
				</p>
				<ul className="list-disc pl-6 mb-3">
					<li>Accessing or receiving a copy of your personal information</li>
					<li>Correcting inaccurate or incomplete information</li>
					<li>Deleting your personal information</li>
					<li>Restricting or objecting to processing of your information</li>
					<li>Data portability (receiving your data in a structured format)</li>
					<li>Withdrawing consent where processing is based on consent</li>
				</ul>
				<p className="mb-3">
					To exercise these rights, please contact us using the information
					provided in Section 10.
				</p>
			</section>

			<section className="mb-6">
				<h2 className="text-2xl font-semibold mb-3">
					7. Cookies and Similar Technologies
				</h2>
				<p className="mb-3">
					DuoBook uses cookies and similar tracking technologies to enhance user
					experience and collect usage information. These technologies help us:
				</p>
				<ul className="list-disc pl-6 mb-3">
					<li>Remember your preferences and settings</li>
					<li>Keep you logged in to your account</li>
					<li>Understand how you use our application</li>
					<li>Improve our services based on usage patterns</li>
					<li>Provide secure authentication features</li>
					<li>Analyze which features are most valuable to users</li>
				</ul>

				<h3 className="text-xl font-medium mb-2">
					7.1 Types of Cookies We Use
				</h3>
				<p className="mb-3">We use the following categories of cookies:</p>
				<ul className="list-disc pl-6 mb-3">
					<li>
						<strong>Essential cookies:</strong> Required for basic functionality
						like authentication and security. These cannot be disabled.
					</li>
					<li>
						<strong>Preference cookies:</strong> Remember your settings and
						preferences to enhance your experience.
					</li>
					<li>
						<strong>Analytics cookies:</strong> Help us understand how users
						interact with our application.
					</li>
					<li>
						<strong>Authentication cookies:</strong> Manage your logged-in
						session and security features.
					</li>
				</ul>

				<h3 className="text-xl font-medium mb-2">7.2 Cookie Management</h3>
				<p className="mb-3">
					When you first visit DuoBook, you'll see a cookie consent banner
					giving you the option to accept or decline non-essential cookies. You
					can change your preferences at any time by clearing cookies in your
					browser settings.
				</p>
				<p className="mb-3">
					You can also control cookies through your browser settings, but
					disabling essential cookies may limit your ability to use certain
					features of our application.
				</p>
			</section>

			<section className="mb-6">
				<h2 className="text-2xl font-semibold mb-3">8. Children's Privacy</h2>
				<p className="mb-3">
					DuoBook is not intended for children under the age of 13. We do not
					knowingly collect personal information from children under 13. If you
					are a parent or guardian and believe your child has provided us with
					personal information, please contact us so we can take appropriate
					action.
				</p>
			</section>

			<section className="mb-6">
				<h2 className="text-2xl font-semibold mb-3">
					9. Changes to This Privacy Policy
				</h2>
				<p className="mb-3">
					We may update our Privacy Policy from time to time. We will notify you
					of any changes by posting the new Privacy Policy on this page and
					updating the "Last updated" date. For significant changes, we may
					provide additional notice, such as an email notification.
				</p>
				<p className="mb-3">
					Your continued use of DuoBook after any modifications to the Privacy
					Policy constitutes your acceptance of such changes.
				</p>
			</section>

			<section className="mb-6">
				<h2 className="text-2xl font-semibold mb-3">10. Contact Us</h2>
				<p className="mb-3">
					If you have any questions, concerns, or requests regarding this
					Privacy Policy or our data practices, please contact us at:
				</p>
				<p className="mb-3">
					Email:{" "}
					<a
						href="mailto:support@duobook.co"
						className="text-blue-600 hover:underline"
					>
						support@duobook.co
					</a>
				</p>
			</section>

			<p className="text-sm text-muted-foreground italic mt-8">
				Last updated: April 2025
			</p>
		</div>
	);
}

export default PrivacyPolicy;
