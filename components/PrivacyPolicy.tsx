import React from 'react';
import { Shield } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <section className="mx-auto max-w-4xl animate-fade-in-up px-2 md:px-0">
      <div className="text-center mb-10 md:mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-6">
          <Shield size={28} className="text-purple-400" />
        </div>
        <h1 className="text-3xl md:text-6xl font-bold text-white tracking-tight mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 uppercase tracking-wider">
          Last updated: July 2026
        </p>
      </div>

      <div className="space-y-4 md:space-y-6 mb-12 md:mb-20">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-10">
          <h2 className="text-lg md:text-2xl font-bold text-white mb-4">Introduction</h2>
          <p className="text-gray-300 leading-relaxed">
            Tabib ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we handle information when you use our AI-powered health assistant application. By using Tabib, you agree to the practices described in this policy.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-10">
          <h2 className="text-lg md:text-2xl font-bold text-white mb-4">Information We Collect</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-white font-semibold mb-2">Symptoms and Health Descriptions</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                When you use the diagnosis feature, you may type or speak symptoms in natural language. This text is sent to our AI analysis service for processing. We do not store your symptom descriptions on any server after your session ends.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Medication Images</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                If you choose to photograph a medication, the image is processed by our AI analysis service to extract information such as name, dosage, and manufacturer. Images are transmitted securely and are not retained after analysis.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Voice Input</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                If you use the microphone feature, your speech is converted to text using your browser's built-in speech recognition. Audio is not recorded or stored by Tabib.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Usage Analytics</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                We collect anonymous, aggregated usage data such as page views and session duration. This data does not identify you personally and is used solely to improve the application.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-10">
          <h2 className="text-lg md:text-2xl font-bold text-white mb-4">How We Use Your Information</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            We use the information described above solely for the following purposes:
          </p>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span>To provide AI-powered health analysis, symptom assessment, and medication information</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span>To generate clinical reports that you can share with your healthcare provider</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span>To improve Tabib's functionality through anonymous analytics</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span>To ensure the security and proper functioning of the application</span>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-10">
          <h2 className="text-lg md:text-2xl font-bold text-white mb-4">Third-Party Services</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Tabib integrates with third-party services to deliver its features. These services process data on our behalf and are contractually obligated to protect it:
          </p>
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <h3 className="text-white font-semibold mb-2">AI Analysis Service</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your symptoms, medication images, and health queries are processed by an AI analysis provider. Data is used only for real-time processing and is not used for training or persistent storage.
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <h3 className="text-white font-semibold mb-2">Text-to-Speech Service</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                If you enable the read-aloud feature, text responses are sent to a third-party text-to-speech service to be converted to audio. No personal identifiers are attached to these requests.
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
              <h3 className="text-white font-semibold mb-2">Analytics</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                We use a privacy-focused analytics service for anonymous, aggregated usage statistics. No cookies are set for tracking purposes, and no personal data is collected.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-10">
          <h2 className="text-lg md:text-2xl font-bold text-white mb-4">Data Storage & Security</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Tabib is designed with privacy in mind:
          </p>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span><strong className="text-white">No server-side storage:</strong> Your conversations, symptoms, and medication data are not stored on any server. All analysis happens in real-time and data exists only in your browser session.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span><strong className="text-white">No user accounts:</strong> Tabib does not require registration or login. There are no user profiles or stored preferences.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span><strong className="text-white">Encrypted transmission:</strong> All data sent to third-party services is transmitted over encrypted HTTPS connections.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1">•</span>
              <span><strong className="text-white">Session-only data:</strong> When you close the browser tab or refresh the page, all conversation history and analysis results are cleared.</span>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-10">
          <h2 className="text-lg md:text-2xl font-bold text-white mb-4">Cookies & Tracking</h2>
          <p className="text-gray-300 leading-relaxed">
            Tabib does not use cookies for tracking or personalization. Any cookies set are strictly for anonymous usage statistics and do not contain personally identifiable information.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-10">
          <h2 className="text-lg md:text-2xl font-bold text-white mb-4">Your Rights</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Since Tabib does not collect or store personal data on any server, there is no personal data for us to delete, modify, or export. Your health conversations exist entirely within your browser and are automatically cleared when you close the tab or refresh the page.
          </p>
          <p className="text-gray-300 leading-relaxed">
            If you have questions about your data or wish to make a request, please contact us using the information below.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-10">
          <h2 className="text-lg md:text-2xl font-bold text-white mb-4">Children's Privacy</h2>
          <p className="text-gray-300 leading-relaxed">
            Tabib is not intended for use by children under the age of 13. We do not knowingly collect information from children. If you are a parent or guardian and believe your child has used Tabib, please contact us so we can address any concerns.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-10">
          <h2 className="text-lg md:text-2xl font-bold text-white mb-4">Changes to This Policy</h2>
          <p className="text-gray-300 leading-relaxed">
            We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. Any updates will be posted on this page with a revised "Last updated" date. We encourage you to review this policy periodically.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-10">
          <h2 className="text-lg md:text-2xl font-bold text-white mb-4">Contact Us</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please reach out to us:
          </p>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
            <p className="text-gray-400 text-sm">
              <strong className="text-white">Email:</strong> support@tabib.cc
            </p>
          </div>
        </div>
      </div>

      <div className="text-center pb-10">
        <p className="text-sm text-gray-500">
          Tabib is not a replacement for professional medical advice. Always consult a licensed healthcare provider.
        </p>
      </div>
    </section>
  );
};
