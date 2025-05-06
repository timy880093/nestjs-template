import * as process from 'node:process';

export default () => {
  return {
    crawlerMvdisUrl: process.env.MVDIS_HOST + '/api/mvdis/owner',
  };
};
