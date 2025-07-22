/**
 * Migration Script: Add Chat Rooms to Existing Flare Chains
 * 
 * This script addresses the Firebase permission denied error by:
 * 1. Finding all chains that lack a groupChatId field
 * 2. Creating corresponding chat rooms for each chain
 * 3. Updating the chain documents with the new groupChatId
 * 
 * Run this script once to fix legacy chains created before chat functionality.
 */

import firestore from '@react-native-firebase/firestore';
import { chatService } from '../app/services/chatService';

interface ChainMigrationResult {
  chainId: string;
  status: 'success' | 'error' | 'skipped';
  chatRoomId?: string;
  error?: string;
}

export class ChainChatMigration {
  
  /**
   * Find all chains missing groupChatId field
   */
  async findChainsNeedingMigration(): Promise<any[]> {
    console.log('🔍 Finding chains without chat rooms...');
    
    try {
      const chainsSnapshot = await firestore().collection('flareChains').get();
      const chainsNeedingMigration: any[] = [];
      
      chainsSnapshot.forEach((doc) => {
        const chainData = doc.data();
        
        // Check if chain is missing groupChatId or has null/undefined groupChatId
        if (!chainData.groupChatId) {
          chainsNeedingMigration.push({
            id: doc.id,
            ...chainData
          });
        }
      });
      
      console.log(`📊 Found ${chainsNeedingMigration.length} chains needing migration`);
      return chainsNeedingMigration;
      
    } catch (error) {
      console.error('❌ Error finding chains for migration:', error);
      throw error;
    }
  }
  
  /**
   * Create chat room for a specific chain
   */
  async createChatRoomForChain(chain: any): Promise<ChainMigrationResult> {
    const { id: chainId, participantIds, creatorUsername } = chain;
    
    try {
      console.log(`🔧 Creating chat room for chain ${chainId}...`);
      
      // Validate required data
      if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return {
          chainId,
          status: 'error',
          error: 'Chain missing valid participantIds array'
        };
      }
      
      // Create chat room using existing service
      const chatRoomId = await chatService.createChatRoom(chainId, participantIds);
      
      // Update chain document with groupChatId
      await firestore().collection('flareChains').doc(chainId).update({
        groupChatId: chatRoomId
      });
      
      // Send welcome message to chat room
      const welcomeMessage = `Welcome to the chain! Created by ${creatorUsername || 'Unknown'}`;
      await chatService.sendSystemMessage(chatRoomId, welcomeMessage);
      
      console.log(`✅ Successfully created chat room ${chatRoomId} for chain ${chainId}`);
      
      return {
        chainId,
        status: 'success',
        chatRoomId
      };
      
    } catch (error: any) {
      console.error(`❌ Failed to create chat room for chain ${chainId}:`, error);
      
      return {
        chainId,
        status: 'error',
        error: error.message || 'Unknown error'
      };
    }
  }
  
  /**
   * Migrate all chains that need chat rooms
   */
  async migrateAllChains(): Promise<ChainMigrationResult[]> {
    console.log('🚀 Starting chain chat room migration...');
    
    try {
      const chainsToMigrate = await this.findChainsNeedingMigration();
      
      if (chainsToMigrate.length === 0) {
        console.log('✅ No chains need migration - all chains already have chat rooms');
        return [];
      }
      
      const results: ChainMigrationResult[] = [];
      
      // Process chains one by one to avoid overwhelming Firebase
      for (const chain of chainsToMigrate) {
        console.log(`📦 Processing chain ${chain.id} (${results.length + 1}/${chainsToMigrate.length})`);
        
        const result = await this.createChatRoomForChain(chain);
        results.push(result);
        
        // Add small delay between operations to be gentle on Firebase
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Summary report
      const successful = results.filter(r => r.status === 'success').length;
      const failed = results.filter(r => r.status === 'error').length;
      
      console.log('📈 Migration Summary:');
      console.log(`  ✅ Successful: ${successful}`);
      console.log(`  ❌ Failed: ${failed}`);
      console.log(`  📊 Total: ${results.length}`);
      
      // Log failed migrations for debugging
      if (failed > 0) {
        console.log('❌ Failed migrations:');
        results
          .filter(r => r.status === 'error')
          .forEach(r => console.log(`   - Chain ${r.chainId}: ${r.error}`));
      }
      
      return results;
      
    } catch (error) {
      console.error('🚨 Migration failed with critical error:', error);
      throw error;
    }
  }
  
  /**
   * Dry run - show what would be migrated without making changes
   */
  async dryRun(): Promise<void> {
    console.log('🧪 Running migration dry run (no changes will be made)...');
    
    try {
      const chainsToMigrate = await this.findChainsNeedingMigration();
      
      if (chainsToMigrate.length === 0) {
        console.log('✅ No chains need migration');
        return;
      }
      
      console.log('📋 Chains that would be migrated:');
      chainsToMigrate.forEach((chain, index) => {
        console.log(`  ${index + 1}. Chain ${chain.id}:`);
        console.log(`     - Participants: ${chain.participantIds?.length || 0}`);
        console.log(`     - Creator: ${chain.creatorUsername || 'Unknown'}`);
        console.log(`     - Status: ${chain.status || 'Unknown'}`);
        console.log(`     - Created: ${chain.createdAt ? new Date(chain.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}`);
      });
      
      console.log(`\n📊 Total chains to migrate: ${chainsToMigrate.length}`);
      console.log('💡 Run migrateAllChains() to perform the actual migration');
      
    } catch (error) {
      console.error('❌ Dry run failed:', error);
      throw error;
    }
  }
  
  /**
   * Verify migration results by checking if all chains now have groupChatId
   */
  async verifyMigration(): Promise<void> {
    console.log('🔍 Verifying migration results...');
    
    try {
      const chainsSnapshot = await firestore().collection('flareChains').get();
      const chainsWithoutChatRooms: string[] = [];
      const chainsWithChatRooms: string[] = [];
      
      chainsSnapshot.forEach((doc) => {
        const chainData = doc.data();
        
        if (chainData.groupChatId) {
          chainsWithChatRooms.push(doc.id);
        } else {
          chainsWithoutChatRooms.push(doc.id);
        }
      });
      
      console.log('📊 Verification Results:');
      console.log(`  ✅ Chains with chat rooms: ${chainsWithChatRooms.length}`);
      console.log(`  ❌ Chains still missing chat rooms: ${chainsWithoutChatRooms.length}`);
      
      if (chainsWithoutChatRooms.length > 0) {
        console.log('❌ Chains still needing migration:');
        chainsWithoutChatRooms.forEach(chainId => console.log(`   - ${chainId}`));
      } else {
        console.log('🎉 Migration successful! All chains now have chat rooms.');
      }
      
    } catch (error) {
      console.error('❌ Verification failed:', error);
      throw error;
    }
  }
}

// Export singleton instance for easy import
export const chainChatMigration = new ChainChatMigration();

// Usage examples:
// 
// // 1. Check what needs to be migrated (safe)
// await chainChatMigration.dryRun();
// 
// // 2. Run the actual migration
// const results = await chainChatMigration.migrateAllChains();
// 
// // 3. Verify everything worked
// await chainChatMigration.verifyMigration();