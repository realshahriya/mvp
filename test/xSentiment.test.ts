import test from 'node:test';
import assert from 'node:assert/strict';
import { extractHashtags, classifySentiment, computeInfluenceScore, aggregateTweets } from '../src/lib/xSentimentEngine';

test('extractHashtags returns normalized hashtags', () => {
    const tags = extractHashtags('New #Cencera and #TrustScore updates');
    assert.deepEqual(tags, ['#cencera', '#trustscore']);
});

test('classifySentiment returns expected labels', () => {
    assert.equal(classifySentiment('Great breakout and bullish move'), 'positive');
    assert.equal(classifySentiment('Rug and exploit detected'), 'negative');
    assert.equal(classifySentiment('Neutral update with data'), 'neutral');
});

test('computeInfluenceScore scales with followers', () => {
    const low = computeInfluenceScore({ id: '1', public_metrics: { followers_count: 10 } });
    const high = computeInfluenceScore({ id: '2', public_metrics: { followers_count: 10000 } });
    assert.ok(high > low);
});

test('aggregateTweets aggregates engagement and sentiment', () => {
    const tweets = [
        {
            id: 't1',
            text: 'Bullish on #Cencera',
            created_at: '2026-01-01T00:00:00.000Z',
            author_id: 'u1',
            public_metrics: { like_count: 10, retweet_count: 2, reply_count: 1, quote_count: 0 },
        },
        {
            id: 't2',
            text: 'Scam alert #Cencera',
            created_at: '2026-01-01T00:30:00.000Z',
            author_id: 'u2',
            public_metrics: { like_count: 3, retweet_count: 1, reply_count: 0, quote_count: 0 },
        },
    ];
    const users = [
        { id: 'u1', username: 'alpha', public_metrics: { followers_count: 1000 } },
        { id: 'u2', username: 'beta', public_metrics: { followers_count: 50 } },
    ];
    const aggregated = aggregateTweets(tweets, users);
    assert.equal(aggregated.engagementTotals.likes, 13);
    assert.equal(aggregated.engagementTotals.retweets, 3);
    assert.equal(aggregated.sentimentPercentages.positive + aggregated.sentimentPercentages.negative + aggregated.sentimentPercentages.neutral, 100);
    assert.ok(aggregated.topInfluentialPosts.length > 0);
});
