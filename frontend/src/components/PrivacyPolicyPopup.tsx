import React from 'react';
import { XIcon } from 'lucide-react';

interface PrivacyPolicyPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyPopup: React.FC<PrivacyPolicyPopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-60"
        onClick={onClose}
      />
      
      {/* Main popup container */}
      <div 
        className="relative z-10 bg-white text-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all animate-fadeIn m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="sticky top-0 z-10 bg-[#004a74] text-white px-5 py-4 flex justify-between items-center">
          <h2 className="text-xl font-medium">Privacy Policy</h2>
          <button 
            onClick={onClose} 
            className="text-white hover:text-gray-200 transition-colors rounded-full hover:bg-white hover:bg-opacity-10 p-1"
            aria-label="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Privacy Policy content */}
        <div className="p-6 space-y-6">
          <p className="text-gray-500 italic">Last Updated: April 23, 2025</p>
          
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-[#004a74]">1. Introduction</h3>
            <p className="text-gray-700">
              Welcome to Cramingo ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our flashcard generation platform.
            </p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-[#004a74]">2. Information We Collect</h3>
            <p className="text-gray-700">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Account information (email address, username, password)</li>
              <li>Profile information (university)</li>
              <li>Content you create (flashcards, study sets, notes)</li>
              <li>Images you upload</li>
              <li>Communications you send to us</li>
            </ul>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-[#004a74]">3. How We Use Your Information</h3>
            <p className="text-gray-700">We use the information we collect to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
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
            <h3 className="text-lg font-semibold text-[#004a74]">4. Sharing of Information</h3>
            <p className="text-gray-700">We may share information about you as follows:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>With other users when you choose to make your study sets public</li>
              <li>With service providers who perform services on our behalf</li>
              <li>In response to legal requirements, court orders, or government requests</li>
              <li>To protect the rights, property, and safety of Fliply and our users</li>
              <li>In connection with a business transfer such as a merger or acquisition</li>
            </ul>
            <p className="text-gray-700 mt-2"><strong>Note:</strong> We can view the flashcards you create and the images you upload to ensure compliance with our Terms of Service and to improve our AI services.</p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-[#004a74]">5. User Content</h3>
            <p className="text-gray-700">
              When you create flashcards or upload images, this content may be visible to Fliply staff for quality assurance, content moderation, and service improvement purposes. Public study sets are visible to all users of the platform. You can control the visibility of your content in your account settings.
            </p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-[#004a74]">6. Data Retention</h3>
            <p className="text-gray-700">
              We store your information for as long as your account is active or as needed to provide you services. You can delete your account at any time, which will remove your personal information from our active databases. However, we may retain some information as required by law or for legitimate business purposes.
            </p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-[#004a74]">7. Security</h3>
            <p className="text-gray-700">
              We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. However, no security system is impenetrable, and we cannot guarantee the security of our systems.
            </p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-[#004a74]">8. Your Choices</h3>
            <p className="text-gray-700">You can:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Access and update your account information</li>
              <li>Control the visibility of your study sets (public or private)</li>
              <li>Opt out of promotional communications</li>
              <li>Delete your account</li>
            </ul>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-[#004a74]">9. Children's Privacy</h3>
            <p className="text-gray-700">
              Our services are not directed to children under 18. We do not knowingly collect personal information from children under 18. If we learn we have collected personal information of a child under 18, we will delete such information.
            </p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-[#004a74]">10. Changes to Privacy Policy</h3>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-[#004a74]">11. Contact Us</h3>
            <p className="text-gray-700">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="pt-3 text-black mt-4">
              <p><strong>Email:</strong> fliply.help@gmail.com</p>
            </div>
          </section>
        </div>
        
        {/* Action buttons */}
        <div className="sticky bottom-0 flex justify-end p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#004a74] hover:bg-[#00659f] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004a74]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPopup;