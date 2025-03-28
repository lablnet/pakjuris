const { getMembers } = require('./scrapers/na/members');

(async() => {
    await getMembers();
})();