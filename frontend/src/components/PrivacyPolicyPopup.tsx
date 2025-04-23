import React from 'react';
import { X } from 'lucide-react';

interface PrivacyPolicyPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyPopup: React.FC<PrivacyPolicyPopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Main popup container */}
      <div 
        className="relative z-10 bg-gradient-to-b from-[#004a74] to-[#003152] 
                  max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/20 shadow-xl w-full m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="sticky top-0 z-10 flex justify-between items-center p-6 border-b border-white/10 bg-gradient-to-b from-[#004a74] to-[#004a74]">
          <h2 className="text-2xl font-bold text-white">Privacy Policy</h2>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Privacy Policy content */}
        <div className="p-8 space-y-6">
          <p className="text-white/70 italic">Last Updated: April 23, 2025</p>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">1. Introduction</h3>
            <p className="text-white/80">
              Welcome to Fliply ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our flashcard generation platform.
            </p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">2. Information We Collect</h3>
            <p className="text-white/80">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 text-white/80 space-y-2">
              <li>Account information (email address, username, password)</li>
              <li>Profile information (university)</li>
              <li>Content you create (flashcards, study sets, notes)</li>
              <li>Images you upload</li>
              <li>Communications you send to us</li>
            </ul>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">3. How We Use Your Information</h3>
            <p className="text-white/80">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-white/80 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Create and manage your account</li>
              <li>Process and complete transactions</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Develop new products and services</li>
              <li>Monitor and analyze usage trends</li>
              <li>Personalize your experience</li>
            </ul>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">4. Sharing of Information</h3>
            <p className="text-white/80">We may share information about you as follows:</p>
            <ul className="list-disc pl-6 text-white/80 space-y-2">
              <li>With other users when you choose to make your study sets public</li>
              <li>With service providers who perform services on our behalf</li>
              <li>In response to legal requirements, court orders, or government requests</li>
              <li>To protect the rights, property, and safety of Fliply and our users</li>
              <li>In connection with a business transfer such as a merger or acquisition</li>
            </ul>
            <p className="text-white/80"><strong>Note:</strong> We can view the flashcards you create and the images you upload to ensure compliance with our Terms of Service and to improve our AI services.</p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">5. User Content</h3>
            <p className="text-white/80">
              When you create flashcards or upload images, this content may be visible to Fliply staff for quality assurance, content moderation, and service improvement purposes. Public study sets are visible to all users of the platform. You can control the visibility of your content in your account settings.
            </p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">6. Data Retention</h3>
            <p className="text-white/80">
              We store your information for as long as your account is active or as needed to provide you services. You can delete your account at any time, which will remove your personal information from our active databases. However, we may retain some information as required by law or for legitimate business purposes.
            </p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">7. Security</h3>
            <p className="text-white/80">
              We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. However, no security system is impenetrable, and we cannot guarantee the security of our systems.
            </p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">8. Your Choices</h3>
            <p className="text-white/80">You can:</p>
            <ul className="list-disc pl-6 text-white/80 space-y-2">
              <li>Access and update your account information</li>
              <li>Control the visibility of your study sets (public or private)</li>
              <li>Opt out of promotional communications</li>
              <li>Delete your account</li>
            </ul>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">9. Children's Privacy</h3>
            <p className="text-white/80">
              Our services are not directed to children under 18. We do not knowingly collect personal information from children under 18. If we learn we have collected personal information of a child under 18, we will delete such information.
            </p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">10. Changes to Privacy Policy</h3>
            <p className="text-white/80">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">11. Contact Us</h3>
            <p className="text-white/80">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-white/80"><strong>Email:</strong> fliply.help@gmail.com</p>
          </section>
        </div>
        
        {/* Action buttons */}
        <div className="sticky bottom-0 flex justify-end p-6 border-t border-white/10 bg-gradient-to-b from-[#003152] to-[#003152]">
          <button
            onClick={onClose}
            className="bg-blue-500/70 hover:bg-blue-600/70 text-white font-medium
                     px-6 py-3 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPopup;