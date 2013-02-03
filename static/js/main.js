var Todo = new App({
    model: new Model({
        settings: {
            HOST: 'http://127.0.0.1',
            PATH: '/todo/'
        }
    })
});

window.addEventListener('DOMContentLoaded', Todo.initialize, false);
