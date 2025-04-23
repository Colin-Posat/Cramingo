import React from 'react';
import { X } from 'lucide-react';

interface TermsOfServicePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsOfServicePopup: React.FC<TermsOfServicePopupProps> = ({ isOpen, onClose }) => {
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
          <h2 className="text-2xl font-bold text-white">Terms of Service</h2>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Terms content */}
        <div className="p-8 space-y-6">
          <p className="text-white/70 italic">Last Updated: April 23, 2025</p>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">1. Acceptance of Terms</h3>
            <p className="text-white/80">By accessing or using Fliply ("the Service", "we", "us"), you agree to be bound by these Terms of Service ("Terms") and all applicable laws and regulations. If you do not agree with any part of these Terms, you may not access or use the Service.</p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">2. Description of the Service</h3>
            <p className="text-white/80">Fliply is an AI-powered flashcard generation platform designed for university students. The Service leverages OpenAI's API to generate study materials based on user input. The Service is provided "as is" and "as available," without warranties of any kind.</p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">3. Eligibility</h3>
            <p className="text-white/80">By using Fliply, you represent that you are at least 18 years of age or have legal parental or guardian consent, and that you are fully able and competent to enter into these Terms.</p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">4. User Accounts</h3>
            <p className="text-white/80">You may be required to create an account to access certain features. You agree to:</p>
            <ul className="list-disc pl-6 text-white/80 space-y-2">
              <li>Provide accurate and complete registration information.</li>
              <li>Maintain the confidentiality of your account credentials.</li>
              <li>Be responsible for all activities under your account.</li>
            </ul>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">5. Permitted and Prohibited Uses</h3>
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-white/90">5.1 Permitted Uses</h4>
              <p className="text-white/80">Fliply is intended for creating and studying flashcards for educational purposes. You are responsible for the content you input or upload.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-white/90">5.2 Prohibited Uses</h4>
              <p className="text-white/80">By using Fliply, you agree <strong>not to</strong>:</p>
              <ul className="list-disc pl-6 text-white/80 space-y-2">
                <li>Upload or submit <strong>any copyrighted content</strong> that you do not have the legal right to use. This includes textbooks, slides, professor handouts, and other materials owned by third parties.</li>
                <li>Violate the intellectual property rights or privacy of any person or entity.</li>
                <li>Use the Service to generate or disseminate harmful, misleading, defamatory, or illegal content.</li>
                <li>Attempt to reverse-engineer, copy, resell, or exploit any portion of Fliply.</li>
              </ul>
              <p className="text-white/80 mt-2"><strong>Important:</strong> You are solely responsible for ensuring the legality of any material you upload. Fliply is not liable for any copyright violations committed by users.</p>
            </div>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">6. Intellectual Property</h3>
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-white/90">6.1 Your Content</h4>
              <p className="text-white/80">You retain ownership of the content you upload or generate. By using Fliply, you grant us a non-exclusive, royalty-free license to process and display your content for the purpose of providing the Service.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-white/90">6.2 Fliply's Content</h4>
              <p className="text-white/80">All code, design, and functionality of Fliply (excluding user-generated content) are the property of Fliply and may not be copied or used without permission.</p>
            </div>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">7. Integration with OpenAI</h3>
            <p className="text-white/80">Fliply uses OpenAI's services to generate flashcards and other content. Use of AI-generated content is subject to OpenAI's terms and your agreement not to misuse or misrepresent it. Fliply does not guarantee the accuracy or appropriateness of AI outputs.</p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">8. Termination</h3>
            <p className="text-white/80">We reserve the right to suspend or terminate your account at any time if you violate these Terms or misuse the Service. You may also delete your account at any time.</p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">9. Disclaimers</h3>
            <p className="text-white/80">Fliply is provided on an "as is" basis. We disclaim all warranties, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement.</p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">10. Limitation of Liability</h3>
            <p className="text-white/80">To the fullest extent permitted by law, Fliply shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.</p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">11. Indemnity</h3>
            <p className="text-white/80">You agree to indemnify and hold harmless Fliply, its owners, developers, and partners from any claims, liabilities, or expenses (including legal fees) arising from your use of the Service or any violation of these Terms.</p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">12. Changes to Terms</h3>
            <p className="text-white/80">We may revise these Terms at any time by posting an updated version on the site. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">13. Governing Law</h3>
            <p className="text-white/80">These Terms are governed by the laws of the State of California, United States, without regard to conflict of law principles.</p>
          </section>
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-white">14. Contact</h3>
            <p className="text-white/80">If you have any questions or concerns about these Terms, please contact us at:</p>
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

export default TermsOfServicePopup;