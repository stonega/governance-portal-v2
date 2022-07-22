import { SupportedNetworks } from 'modules/web3/constants/networks';
import { backoffRetry } from 'lib/utils';
import BigNumber from 'lib/bigNumberJs';
import { cacheGet, cacheSet } from 'modules/cache/cache';
import { fetchRawPollTally } from 'modules/polling/api/fetchRawPollTally';
import { fetchVotesByAddressForPoll } from 'modules/polling/api/fetchVotesByAddress';
import { Poll, PollTally, RawPollTally, RawPollTallyRankedChoice } from 'modules/polling/types';
import { parseRawPollTally } from 'modules/polling/helpers/parseRawTally';
import { pollHasEnded } from './utils';
import { getPollTallyCacheKey } from 'modules/cache/constants/cache-keys';
import { FIVE_MINUTES_IN_MS, ONE_DAY_IN_MS } from 'modules/app/constants/time';

export async function getPollTally(poll: Poll, network: SupportedNetworks): Promise<PollTally> {
  const cacheKey = getPollTallyCacheKey(poll.pollId);
  const cachedTally = await cacheGet(cacheKey, network);
  if (cachedTally) {
    return JSON.parse(cachedTally);
  }
  // Builds raw poll tally
  const tally: RawPollTally = await backoffRetry(3, () =>
    fetchRawPollTally(poll.pollId, poll.parameters, network)
  );

  const endUnix = new Date(poll.endDate).getTime() / 1000;
  const votesByAddress = await fetchVotesByAddressForPoll(poll.pollId, endUnix, network);

  const totalMkrParticipation = tally.totalMkrParticipation;
  const winner: string = tally.winner || '';
  const numVoters = tally.numVoters;

  const tallyObject = {
    parameters: poll.parameters,
    options:
      Object.keys(tally.options).length > 0
        ? tally.options
        : {
            '0': {
              mkrSupport: new BigNumber('0'),
              winner: false
            },
            '1': {
              mkrSupport: new BigNumber('0'),
              winner: false
            },
            '2': {
              mkrSupport: new BigNumber('0'),
              winner: false
            }
          },
    winner,
    totalMkrParticipation,
    numVoters,
    votesByAddress
  } as RawPollTally;

  if ('rounds' in tally) (tallyObject as RawPollTallyRankedChoice).rounds = tally.rounds;
  const parsedTally = parseRawPollTally(tallyObject, poll);

  const pollEnded = pollHasEnded(poll);

  cacheSet(cacheKey, JSON.stringify(parsedTally), network, pollEnded ? ONE_DAY_IN_MS : FIVE_MINUTES_IN_MS);

  return parsedTally;
}