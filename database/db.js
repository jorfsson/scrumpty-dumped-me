const { knex } = require('./knex');

const self = (module.exports = {
  addMessage: (user, message) => knex('chathistory')
    .insert({user, message})
    .then(()=> knex('chathistory')
    .select()),

  addTask: (title, description, sprint_id, user_id) => knex('tasks')
    .insert({ title, description, sprint_id, user_id })
    .then(id => knex('tasks')
      .where('id', id)
      .select())
    .then(tasks => tasks[0]),
  // returns all tasks, adding the blockers each task has to the task object

  getTasks: sprint_id => knex('tasks')
    .where({ sprint_id })
    .then((tasks) => {
      let pchain = Promise.resolve();
      // loop over each task, retrieve the blockers the task has,
      // then add the array of blockers to the task
      tasks.forEach((task) => {
        pchain = pchain.then(() => self.getBlockers(task.id).then((blockers) => {
          task.blockers = blockers;
        }));
      });

      return pchain.then(() => tasks);
    }),

  updateTask: ({
    id,
    title,
    description,
    user_id,
    status_code,
    eta,
    priority_code,
    difficulty,
  }) => knex('tasks')
    .where('id', id)
    .update({
      title,
      description,
      user_id,
      status_code,
      eta,
      priority_code,
      difficulty,
    })
    .then(() => knex('tasks')
      .where('id', id)
      .select())
    .then(tasks => tasks[0]),

  addBlocker: (task_id, title, description, user_id) => knex('blockers')
    .insert({ task_id, title, description })
    .then(id => knex('blockers')
      .where('id', id)
      .select().first()),

  getBlockers: task_id => knex('blockers')
    .where('task_id', task_id)
    .then(result => (Array.isArray(result) ? result : [result])),

  updateBlocker: ({
    id, title, description, task_id, status_code,
  }) => knex('blockers')
    .where('id', id)
    .update({
      title,
      description,
      task_id,
      status_code,
    })
    .then(() => knex('blockers')
      .where('id', id)
      .select())
    .then(blockers => blockers[0]),

  addUser: (username, password, description) => knex('users')
    .insert({ username, password, description })
    .then(id => knex('users')
      .where('id', id)
      .select())
    .then(users => users[0]),

  getUsers: () => knex('users')
    .select()
    .then(users => users.map(user => ({
      id: user.id,
      username: user.username,
      description: user.description,
      profile_image_url: user.profile_image_url
    }))),

  userExists: username => knex('users')
    .where('username', username)
    .select()
    .first(),
  userHasPassword: (username, password) => knex('users')
    .where({ username, password })
    .select()
    .first(),

  updateUser: (username, description, password) => knex('users')
    .where('username', username)
    .select()
    .then(arr => knex('users')
      .where('id', arr[0].id)
      .update({ username, description, password })
    )
    .then(() => knex('users')
      .where('username', username)
      .select())
    .then(users => users[0]),

  getUserByName: username => knex('users')
    .where('username', username)
    .select()
    .then(users => users[0]),

  getUserById: id => knex('users')
    .where('id', id)
    .select()
    .then(users => users[0]),

  addSprint: (title, owner_id) => knex('sprints')
    .insert({ title, owner_id })
    .then(id => knex('sprints')
      .where('id', id)
      .select())
    .then(sprints => sprints[0]),
  // returns all tasks, adding the blockers each task has to the task object

  getSprints: user_id => knex('sprintusers')
    .where({ user_id })
    .then((results) => {
      let pChain = Promise.resolve();
      const solution = [];
      results.forEach((result) => {
        pChain = pChain.then(() => knex('sprints')
          .where({ id: result.sprint_id })
          .select()
          .first()
          .then(({ id, title }) => {
            solution.push({ id, title });
          }));
      });

      return pChain.then(() => solution);
    }),

  removeUserFromSprint: (owner_id, user_id, sprint_id) => knex('sprints')
    .where({ owner_id, id: sprint_id })
    .select()
    .first()
    .then((sprint) => {
      if (!sprint) {
        throw 'Invalid credentials to add user to a sprint';
      }
    })
    .then(() => knex('sprintusers')
      .where({ user_id, sprint_id })
      .select()
      .first())
    .then((res) => {
      if (!res) {
        throw 'User is not in the sprint!';
      }
    })
    .then(() => knex('sprintusers').where({ user_id, sprint_id }).del())
    .then(() => true),

  addUserToSprint: (owner_id, username, sprint_id) => {
    let user_id = null;
    return knex('sprints')
      .where({ owner_id, id: sprint_id })
      .select()
      .first()
      .then((sprint) => {
        if (!sprint) {
          throw 'Invalid credentials to add user to a sprint';
        }
      })
      .then(() => self.getUserByName(username))
      .then((user) => {
        if (!user) {
          throw 'No such user exists';
        }
        user_id = user.id;
        return knex('sprintusers')
          .where({ user_id, sprint_id })
          .select()
          .first();
      })
      .then((res) => {
        if (res) {
          throw 'User is already in the sprint!';
        }
      })
      .then(() => knex('sprintusers').insert({ user_id, sprint_id }))
      .then(() => knex('sprints')
        .where({ id: sprint_id })
        .select()
        .first());
  },

  getUsersInSprint: sprint_id => knex('sprintusers')
    .where({ sprint_id })
    .select()
    .then((results) => {
      let pChain = Promise.resolve();
      const solution = [];

      results.forEach((result) => {
        pChain = pChain.then(() => knex('users')
          .where({ id: result.user_id })
          .select()
          .first()
          .then((user) => {
            solution.push({ username: user.username, id: user.id });
          }));
      });

      return pChain.then(() => solution);
    }),

  isOwner: (owner_id, id) => knex('sprints').where({ id, owner_id }).select().first()
    .then(res => (!!res)),

  userCanAccessTask: (task_id, user_id) => knex('tasks')
    .where({ id: task_id }).select().first()
    .then(({ sprint_id }) => knex('sprintusers').where({ sprint_id, user_id }).select().first())
    .then((result) => {
      if (!result) {
        throw ('User does not have access to the sprint for the specified task');
      }
    }),

  userCanAccessSprint: (sprint_id, user_id) => knex('sprintusers').where({ sprint_id, user_id }).select().first()
    .then((result) => {
      if (!result) {
        throw ('User does not have access to the sprint for the specified task');
      }
    }),

  updateUserProfilePic: (username, url) => knex('users').where('username', username).select()
    .then(arr => knex('users').where('id', arr[0].id).update({ profile_image_url: url }))
    .then(() => knex('users').where('username', username).select())
    .then(users => users[0]),

  addUserToRejectPool: (user_id, sprint_id) => {
    const pool_id = sprint_id;
    return knex('sprintusers').insert({ user_id, sprint_id }) //sprint_id = id of user's no-show pool. user_id = id of rejected user
      .then(() => knex('sprintusers').where({ sprint_id: pool_id }).select())
  },

  getRejects: (pool_id) => knex('sprintusers').where({ sprint_id: pool_id }).select()

});
