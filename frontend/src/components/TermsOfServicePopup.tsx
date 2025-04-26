import React from 'react';
import { XIcon } from 'lucide-react';

interface TermsOfServicePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsOfServicePopup: React.FC<TermsOfServicePopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white text-gray-800 rounded-lg shadow-xl w-full max-w-3xl transform transition-all animate-fadeIn max-h-[90vh] flex flex-col">
        <div className="bg-[#004a74] text-white px-5 py-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="font-medium text-lg">Terms of Service</h2>
          <button 
            onClick={onClose} 
            className="text-white hover:text-gray-200 transition-colors rounded-full hover:bg-white hover:bg-opacity-10 p-1"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-grow">
          <p className="text-gray-500 italic mb-4">Last Updated: April 23, 2025</p>
          
          <section className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">1. Acceptance of Terms</h3>
            <p className="text-gray-700">By accessing or using Fliply ("the Service", "we", "us"), you agree to be bound by these Terms of Service ("Terms") and all applicable laws and regulations. If you do not agree with any part of these Terms, you may not access or use the Service.</p>
          </section>
          
          <section className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">2. Description of the Service</h3>
            <p className="text-gray-700">Fliply is an AI-powered flashcard generation platform designed for university students. The Service leverages OpenAI's API to generate study materials based on user input. The Service is provided "as is" and "as available," without warranties of any kind.</p>
            <p className="text-gray-700 mt-2 font-semibold">Fliply is an independent platform and is not affiliated with, sponsored by, or endorsed by the University of California, Santa Cruz (UCSC).</p>
          </section>
          
          <section className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">3. Eligibility</h3>
            <p className="text-gray-700">By using Fliply, you represent that you are at least 18 years of age or have legal parental or guardian consent, and that you are fully able and competent to enter into these Terms.</p>
          </section>
          
          <section className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">4. User Accounts</h3>
            <p className="text-gray-700">You may be required to create an account to access certain features. You agree to:</p>
            <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-1">
              <li>Provide accurate and complete registration information.</li>
              <li>Maintain the confidentiality of your account credentials.</li>
              <li>Be responsible for all activities under your account.</li>
            </ul>
          </section>
          
          <section className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">5. Permitted and Prohibited Uses</h3>
            <div className="mb-3">
              <h4 className="text-md font-medium text-gray-800 mb-1">5.1 Permitted Uses</h4>
              <p className="text-gray-700">Fliply is intended for creating and studying flashcards for educational purposes. You are responsible for the content you input or upload.</p>
            </div>
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-1">5.2 Prohibited Uses</h4>
              <p className="text-gray-700">By using Fliply, you agree <strong>not to</strong>:</p>
              <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-1">
                <li>Upload or submit <strong>any copyrighted content</strong> that you do not have the legal right to use. This includes textbooks, slides, professor handouts, and other materials owned by third parties.</li>
                <li>Violate the intellectual property rights or privacy of any person or entity.</li>
                <li>Use the Service to generate or disseminate harmful, misleading, defamatory, or illegal content.</li>
                <li>Attempt to reverse-engineer, copy, resell, or exploit any portion of Fliply.</li>
              </ul>
              <p className="text-gray-700 mt-2"><strong>Important:</strong> You are solely responsible for ensuring the legality of any material you upload. Fliply is not liable for any copyright violations committed by users.</p>
            </div>
          </section>
          
          <section className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">6. Intellectual Property</h3>
            <div className="mb-3">
              <h4 className="text-md font-medium text-gray-800 mb-1">6.1 Your Content</h4>
              <p className="text-gray-700">You retain ownership of the content you upload or generate. By using Fliply, you grant us a non-exclusive, royalty-free license to process and display your content for the purpose of providing the Service.</p>
            </div>
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-1">6.2 Fliply's Content</h4>
              <p className="text-gray-700">All code, design, and functionality of Fliply (excluding user-generated content) are the property of Fliply and may not be copied or used without permission.</p>
            </div>
          </section>

          <section className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">7. Copyright Infringement and DMCA Policy</h3>
            <p className="text-gray-700">
              Fliply respects the intellectual property rights of others and expects users to do the same.
              If you believe that any content on the Service infringes your copyright, please submit a notice including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mt-2 space-y-1">
              <li>A description of the copyrighted work you claim has been infringed.</li>
              <li>The specific URL or location of the allegedly infringing content.</li>
              <li>Your contact information, including your name, email address, and phone number.</li>
              <li>A statement that you have a good faith belief that the use is not authorized by the copyright owner, its agent, or the law.</li>
              <li>A statement that the information you provide is accurate, and under penalty of perjury, that you are authorized to act on behalf of the copyright owner.</li>
            </ul>
            <p className="text-gray-700 mt-2">
              Please send notices to: <strong>fliply.help@gmail.com</strong>. Upon receipt of a valid notice, Fliply will promptly remove or disable access to the allegedly infringing content.
            </p>
          </section>
          
          <section className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">8. Integration with OpenAI</h3>
            <p className="text-gray-700">Fliply uses OpenAI's services to generate flashcards and other content. Use of AI-generated content is subject to OpenAI's terms and your agreement not to misuse or misrepresent it. Fliply does not guarantee the accuracy or appropriateness of AI outputs.</p>
          </section>
          
          <section className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">9. Termination</h3>
            <p className="text-gray-700">We reserve the right to suspend or terminate your account at any time if you violate these Terms or misuse the Service. You may also delete your account at any time.</p>
          </section>
          
          <section className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">10. Disclaimers</h3>
            <p className="text-gray-700">Fliply is provided on an "as is" basis. We disclaim all warranties, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement.</p>
          </section>
          
          <section className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">11. Limitation of Liability</h3>
            <p className="text-gray-700">To the fullest extent permitted by law, Fliply shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.</p>
          </section>
          
          <section className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">12. Indemnity</h3>
            <p className="text-gray-700">You agree to indemnify and hold harmless Fliply, its owners, developers, and partners from any claims, liabilities, or expenses (including legal fees) arising from your use of the Service or any violation of these Terms.</p>
          </section>
          
          <section className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">13. Changes to Terms</h3>
            <p className="text-gray-700">We may revise these Terms at any time by posting an updated version on the site. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
          </section>
          
          <section className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">14. Governing Law</h3>
            <p className="text-gray-700">These Terms are governed by the laws of the State of California, United States, without regard to conflict of law principles.</p>
          </section>
          
          <section className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">15. Contact</h3>
            <p className="text-gray-700">If you have any questions or concerns about these Terms, please contact us at:</p>
            <p className="text-gray-700 mt-1"><strong>Email:</strong> fliply.help@gmail.com</p>
          </section>
        </div>
        
        <div className="flex justify-end px-5 py-4 border-t border-gray-300 sticky bottom-0 bg-white">
          <button
            type="button"
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

export default TermsOfServicePopup;
