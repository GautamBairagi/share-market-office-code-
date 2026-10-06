/**
 * AI Assistant Page
 *
 * Full-screen AI assistant with voice and text input
 */

import React from 'react';
import AIAssistant from '../../components/AIAssistant';

const AIAssistantPage = () => {
    return (
        <div className="h-screen flex flex-col">
            <AIAssistant />
        </div>
    );
};

export default AIAssistantPage;
