function App(params){

    var model = params.model;
    this.model = model;

    function getEl(selector, parent){
        var container = parent || document;
        var elements = container.querySelectorAll(selector);
        return elements.length === 1 ? elements[0] : elements;
    }

    function isEl(selector, element){
        var els = getEl(selector);
        return Array.prototype.indexOf.call(els.length ? els : [els], element) > -1;
    };

    function getParents(selector, element){
        var matches = [];
        var parent = element.parentNode;
        if ( parent ) {    
            do {
                if ( isEl(selector, parent) ) {
                    matches.push(parent);
                }
                parent = parent.parentNode;
            }
            while ( parent );
        }
        return matches.length === 1 ? matches[0] : matches;
    }

    function createEl(tag, attributes){
        var element = document.createElement(tag);
        for ( var key in attributes ) {
            element[key] = attributes[key];
        }
        return element;
    };

    function template(template, data){
        function replaceVariables(str, key){
            return data[key];
        };
        function replaceExpressions(str, expr){
            function scoped(){
                for ( var key in data ) {
                    eval('var ' + key + '=data[key];' );
                }
                return eval(expr);
            };
            return scoped();
        };
        return template
            .replace(/\{\{\s*(\w+)\s*\}\}/g, replaceVariables)
            .replace(/\{\%\s*(.+)\s*\%\}/g, replaceExpressions);
    }

    function getTaskTemplate(){
        return getEl('#template-task').innerHTML;
    };

    function createTask(data){
        var containerId = '#temp-container';
        var taskTemplate = getEl('#template-task').innerHTML;
        var container = createEl('div', {
            id: containerId,
            innerHTML: template(taskTemplate, data)
        });
        return bindTaskEvents( getEl('.todo-item', container) );
    };

    function bindTaskEvents(element){
        getEl('.todo-checkbox', element).addEventListener('change', saveState, false);
        getEl('.todo-remove', element).addEventListener('click', function(e){
            var item = getParents('.todo-item', e.currentTarget);
            var id = item.dataset.id;
            item.parentNode.removeChild(item);
            model.remove(id);
            model.save();
            console.log(id);
        }, false)
        return element;
    };

    function getContainer(){
        return getEl('.todo-list');
    }

    function render(model){
        var container = getContainer();
        container.innerHTML = '';
        model.data.forEach(function(item){
            container.appendChild(createTask(item));
        });
    };

    function addTask(text){
        var taskId = model.add({
            text: text,
            checked: false
        });
        var taskEl = createTask({
            text: text,
            checked: false,
            id: taskId
        });
        getContainer().appendChild(taskEl);
    };

    function initializeTaskField(){
        var field = getEl('.todo-field');
        field.addEventListener('keyup', function(e){
            var value = field.value.replace(/^\s*/, '').replace(/\s*$/, '');
            if ( e.keyCode === 13 && value ) {
                field.value = '';
                addTask(value);
                model.save(); // TODO: turn on when backend will be done
            }
        });
    };

    function saveState(e){
        var target = e.currentTarget;
        var id = getParents('.todo-item', target).dataset.id;
        var checked = target.checked;
        console.log('Switched checkbox id', +id, checked ? 'on' : 'off', target );
        model.set(id, {
            checked: checked
        });
        model.save(); // TODO: turn on when backend will be done
    };

    function getDate(){
        var today = new Date();
        return today.getFullYear() + '-'
            + ( today.getMonth() + 1 ) + '-'
            + today.getDate();
    };

    function initialize(){
        model.setDate(getDate());
        model.fetch(function(){
            render(model);
            initializeTaskField();
        });
    };

    this.initialize = initialize;
    this.setModel = function(newModel){
        model = newModel;
        initialize();
    };

};
