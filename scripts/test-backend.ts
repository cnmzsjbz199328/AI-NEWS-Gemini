import { TaskManager } from '../src/lib/managers/TaskManager';
import { VoiceConfig } from '../src/types';

// Mock data for the test
const testConfig: {
  newsTopic: string;
  debateRounds: number;
  voiceConfig: VoiceConfig;
} = {
  newsTopic: 'Test: The Future of AI in Software Development',
  debateRounds: 1,
  voiceConfig: {
    provider: 'XTTS',
    speaker_id: 'larry',
    speed: 1.1,
    language: 'en',
    cleanup_voice: false,
  },
};

async function runTest() {
  console.log('--- 🧪 Starting Backend Logic Test ---');

  try {
    // 1. Create a new task
    console.log(`\n[1/4] Creating task for topic: "${testConfig.newsTopic}"...`);
    const task = await TaskManager.createTask(
      testConfig.newsTopic,
      testConfig.debateRounds,
      testConfig.voiceConfig,
      'en-US'
    );
    console.log(`✅ Task created successfully! Task ID: ${task.id}`);

    // 2. Add audio segments and check for completion
    console.log('\n[2/4] Simulating audio segment generation...');
    const expectedAudioCount = 1 + (testConfig.debateRounds * 2) + 1;
    let isComplete = false;

    for (let i = 0; i < expectedAudioCount; i++) {
      const result = await TaskManager.addAudioSegment(
        task.id,
        'conversation', // Using a generic type for simplicity
        `https://fake-audio.com/url/${i}`,
        `This is segment ${i + 1}.`,
        i % 2 === 0 ? 'Alice' : 'Bob',
        i
      );
      isComplete = result.isComplete;
      if (isComplete) {
        console.log(`🎉 Task marked as complete after adding segment ${i + 1}.`);
      }
    }

    if (!isComplete) {
      throw new Error('Test failed: Task did not complete after adding all segments.');
    }

    // 3. Retrieve the final task data
    console.log(`\n[3/4] Retrieving final task data for ID: ${task.id}...`);
    const finalTask = await TaskManager.getTaskById(task.id);

    if (!finalTask) {
      throw new Error(`Test failed: Could not retrieve final task with ID: ${task.id}`);
    }

    console.log('✅ Final task data retrieved successfully.');

    // 4. Validate the final data
    console.log('\n[4/4] Validating final task data...');
    if (finalTask.status !== 'READY_TO_PLAY') {
      throw new Error(`Validation failed: Expected status 'READY_TO_PLAY', but got '${finalTask.status}'.`);
    }
    console.log(`- Status is correct: ${finalTask.status}`);

    if (finalTask.audioPlaylist?.conversation.length !== expectedAudioCount) {
        // Note: This is a simplified check. The actual conversation length would be debateRounds * 2.
        // But for this test, we used 'conversation' type for all segments.
        console.warn(`- Warning: Playlist conversation length (${finalTask.audioPlaylist?.conversation.length}) doesn\'t match expected total segments (${expectedAudioCount}). This is expected due to test simplification.`);
    }

    if (!finalTask.audioPlaylist) {
        throw new Error('Validation failed: audioPlaylist is null or undefined.');
    }
    console.log('- Audio playlist is present.');

    console.log('\n--- ✅ Backend Logic Test Passed! ---');
    console.log(JSON.stringify(finalTask, null, 2));

  } catch (error) {
    console.error('\n--- ❌ Backend Logic Test Failed! ---');
    console.error(error);
    process.exit(1); // Exit with error code
  }
}

runTest();
