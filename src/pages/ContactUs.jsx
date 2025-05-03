import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

function ContactUs() {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		subject: "",
		message: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Basic validation
		if (!formData.name || !formData.email || !formData.message) {
			toast.error("Please fill in all required fields");
			return;
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			toast.error("Please enter a valid email address");
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch("/api/contact", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to send message");
			}

			toast.success("Message sent successfully! We'll get back to you soon.");

			// Reset form
			setFormData({
				name: "",
				email: "",
				subject: "",
				message: "",
			});
		} catch (error) {
			console.error("Error sending message:", error);
			toast.error(
				error.message || "Failed to send message. Please try again later."
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-2xl mx-auto">
				<h1 className="text-3xl font-bold mb-6">Contact Us</h1>

				<div className="mb-8">
					<p className="mb-4">
						Have questions, feedback, or need help with DuoBook? We're here to
						assist you!
					</p>
					<p className="mb-4">
						Fill out the form below and our team will get back to you as soon as
						possible.
					</p>
					<p className="mb-4">
						You can also email us directly at{" "}
						<a
							href="mailto:support@duobook.co"
							className="text-primary hover:underline"
						>
							support@duobook.co
						</a>
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-2">
							<Label htmlFor="name">
								Name <span className="text-red-500">*</span>
							</Label>
							<Input
								id="name"
								name="name"
								value={formData.name}
								onChange={handleChange}
								placeholder="Your name"
								required
								disabled={isSubmitting}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">
								Email <span className="text-red-500">*</span>
							</Label>
							<Input
								id="email"
								name="email"
								type="email"
								value={formData.email}
								onChange={handleChange}
								placeholder="your@email.com"
								required
								disabled={isSubmitting}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="subject">Subject</Label>
						<Input
							id="subject"
							name="subject"
							value={formData.subject}
							onChange={handleChange}
							placeholder="What is your message about?"
							disabled={isSubmitting}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="message">
							Message <span className="text-red-500">*</span>
						</Label>
						<Textarea
							id="message"
							name="message"
							value={formData.message}
							onChange={handleChange}
							placeholder="How can we help you?"
							className="min-h-[150px]"
							required
							disabled={isSubmitting}
						/>
					</div>

					<Button
						type="submit"
						className="w-full md:w-auto bg-amber-800 text-white"
						disabled={isSubmitting}
					>
						{isSubmitting ? "Sending..." : "Send Message"}
					</Button>
				</form>
			</div>
		</div>
	);
}

export default ContactUs;
