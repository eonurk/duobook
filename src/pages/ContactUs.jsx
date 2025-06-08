import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
	Mail,
	MessageSquare,
	Send,
	CheckCircle,
	Clock,
	HeadphonesIcon,
} from "lucide-react";
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
		<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
			<div className="container mx-auto px-4 py-12">
				<div className="max-w-6xl mx-auto">
					{/* Hero Section */}
					<div className="text-center mb-16">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mb-6">
							<MessageSquare className="w-8 h-8 text-white" />
						</div>
						<h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
							Get in Touch
						</h1>
						<p className="text-md text-gray-600 max-w-2xl mx-auto leading-relaxed">
							Have questions about DuoBook? We're here to help you on your
							language learning journey.
						</p>
					</div>

					<div className="grid lg:grid-cols-3 gap-12">
						{/* Contact Form */}
						<div className="lg:col-span-3">
							<div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
								<div className="mb-8">
									<h2 className="text-2xl font-bold text-gray-900 mb-2">
										Send us a message
									</h2>
									<p className="text-gray-600">
										Fill out the form below and we'll get back to you soon.
									</p>
								</div>

								<form onSubmit={handleSubmit} className="space-y-6">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
										<div className="space-y-2">
											<Label
												htmlFor="name"
												className="text-sm font-medium text-gray-700"
											>
												Name <span className="text-red-500">*</span>
											</Label>
											<Input
												id="name"
												name="name"
												value={formData.name}
												onChange={handleChange}
												placeholder="Your full name"
												required
												disabled={isSubmitting}
												className="h-12 border-gray-200 focus:border-amber-500 focus:ring-amber-500 rounded-xl"
											/>
										</div>

										<div className="space-y-2">
											<Label
												htmlFor="email"
												className="text-sm font-medium text-gray-700"
											>
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
												className="h-12 border-gray-200 focus:border-amber-500 focus:ring-amber-500 rounded-xl"
											/>
										</div>
									</div>

									<div className="space-y-2">
										<Label
											htmlFor="subject"
											className="text-sm font-medium text-gray-700"
										>
											Subject
										</Label>
										<Input
											id="subject"
											name="subject"
											value={formData.subject}
											onChange={handleChange}
											placeholder="What's this about?"
											disabled={isSubmitting}
											className="h-12 border-gray-200 focus:border-amber-500 focus:ring-amber-500 rounded-xl"
										/>
									</div>

									<div className="space-y-2">
										<Label
											htmlFor="message"
											className="text-sm font-medium text-gray-700"
										>
											Message <span className="text-red-500">*</span>
										</Label>
										<Textarea
											id="message"
											name="message"
											value={formData.message}
											onChange={handleChange}
											placeholder="Tell us what you think..."
											className="min-h-[150px] border-gray-200 focus:border-amber-500 focus:ring-amber-500 rounded-xl resize-none text-base md:text-sm"
											required
											disabled={isSubmitting}
										/>
									</div>

									<Button
										type="submit"
										className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-50"
										disabled={isSubmitting}
									>
										{isSubmitting ? (
											<>
												<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
												Sending...
											</>
										) : (
											<>
												<Send className="w-4 h-4 mr-2" />
												Send Message
											</>
										)}
									</Button>
								</form>
							</div>
						</div>
					</div>

					{/* Bottom CTA */}
					<div className="mt-16 text-center bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100">
						<CheckCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
						<h3 className="text-2xl font-bold text-gray-900 mb-2">
							We're here to help!
						</h3>
						<p className="text-gray-600 max-w-2xl mx-auto">
							Whether you have questions about features, need technical support,
							or want to share feedback, our team is dedicated to making your
							language learning experience amazing.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default ContactUs;
