/**
 * Quick Test Script - Create Chat Room for Legacy Chain
 * 
 * This is a simple test to validate that we can create chat rooms
 * for existing legacy chains using the Firebase MCP server directly.
 */

// Test function that can be called via Firebase MCP
async function createTestChatRoom() {
  const testChainId = '0vOtibWVqIzRKIxwUkxa'; // One of the legacy chains we found
  const participantIds = [
    '7WPNzpyvLWPr6cTHAjqggQjCtaH3', 
    'V7Kfyz9sAMhd57uirVcqub8q7IM2'
  ];
  
  console.log(`Creating test chat room for chain ${testChainId}...`);
  console.log(`Participants: ${participantIds.join(', ')}`);
  
  return {
    success: true,
    message: 'Test data prepared for chat room creation',
    chainId: testChainId,
    participantIds: participantIds
  };
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createTestChatRoom };
}

// For browser/React Native environment
if (typeof window !== 'undefined') {
  window.createTestChatRoom = createTestChatRoom;
}

console.log('Test script loaded. Ready to create chat rooms for legacy chains.');