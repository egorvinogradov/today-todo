function Model(params){

    var _this = this;
    var _offline = false;

    this.data = params.data;
    this.date = params.date;
    this.settings = params.settings;

    function getModelData(){
        return _this.data;
    };

    function getModelDate(){
        return _this.date;
    };

    function getModelSettings(){
        return _this.settings;
    };

    function setModelData(data){
        _this.data = data;
    }

    function setModelDate(dateStr) {
        _this.date = dateStr;
    }

    function ajax(params){
        var request = new XMLHttpRequest();
        var responseTimer;
        function handleError(e){
            console.error('Can\'t load data:', e.message, e);
            params.error && params.error(e);
        };
        request.open(params.method || 'GET', params.url, true);
        request.onreadystatechange = function(){
            if ( request.readyState === 4 ) {
                if ( request.status === 200 ) {
                    if ( params.success ) {
                        try {
                            var json = JSON.parse(request.responseText);
                            params.success(json);
                        }
                        catch(e){
                            params.success(request.responseText);
                        }
                    }
                }
                else {
                    handleError({
                        message: 'Bad request',
                        data: request
                    });
                }
                clearTimeout(responseTimer);
            }
        };
        request.send(params.data || null);
        responseTimer = setTimeout(function(){
            request.abort();
            handleError({
                message: 'Time is over'
            });
        }, 10000);
    };

    function getIndexById(id){
        var model = getModelData();
        for ( var i = 0, l = model.length; i < l; i++ ) {
            if ( model[i].id == id ) {
                return i;
            }
        }
        return -1;
    };

    function saveToLocalStorage(){
        localStorage.setItem('todo_' + getModelDate(), JSON.stringify(getModelData()));
    };

    function getFromLocalStorage(){
        return localStorage.getItem('todo_' + getModelDate());
    };

    function saveToServer(callbacks){
        var data = {};
        data[getModelDate()] = getModelData();
        ajax({
            method: 'POST',
            url: getModelSettings().HOST + getModelSettings().PATH,
            data: data,
            success: callbacks.success,
            error: callbacks.error
        });
    };

    function waitForConnection(callback){
        if ( !_offline ) {
            console.log('Switched to offline mode');
            _offline = true;
            var syncTimer = setTimeout(function(){
                console.log('is online?')
                if ( navigator.onLine ) {
                    _offline = false;
                    clearTimeout(syncTimer);
                    console.log('Switched to online mode');
                    callback();
                }
            }, 5000);
        }
    };

    function getItem(id){
        return getModelData()[getIndexById(id)];
    };

    function setItem(id, values){
        var index = getIndexById(id);
        for ( var prop in values ) {
            getModelData()[index][prop] = values[prop];
        }
    };

    function fetchModel(callbacks){
        function fetchLocally(){
            try {
                var data = JSON.parse(getFromLocalStorage());
                if ( data.length ) {
                    console.log('Fetched model from local storage', data);
                    setModelData(data);
                    callbacks.success && callbacks.success(data);
                }
                else {
                    handleError();
                }
            }
            catch(e){
                handleError();
            }
        }
        function handleError(){
            console.error('Can\'t fetch model');
            setModelData([]);
            callbacks.error && callbacks.error();
        }
        if ( navigator.onLine ) {
            ajax({
                url: getModelSettings().HOST + getModelSettings().PATH,
                data: {
                    date: getModelDate()
                },
                success: function(data){
                    console.log('Fetched model from server', data);
                    setModelData(data);
                    callbacks.success && callbacks.success(data);
                },
                error: fetchLocally
            });
        }
        else {
            fetchLocally();
        }
    };

    function saveModel(){
        saveToLocalStorage();

        if ( navigator.onLine ) {
            saveToServer({
                success: function(data){
                    console.log('Saved model', data);
                },
                error: function(){
                    waitForConnection(saveModel);
                }
            });
        }
        else {
            waitForConnection(saveModel);
        }
    }

    function generateNewId(){
        var max = 0;
        getModelData().forEach(function(item){
            max = Math.max(max, item.id);
        });
        return ++max;
    };

    function addItem(values){
        var id = generateNewId();
        values.id = id;
        getModelData().push(values);
        return id;
    };

    function removeItem(id){
        var index = getIndexById(id);
        var model = getModelData();
        setModelData(model.slice(0, index).concat(model.slice(++index)));
    };

    this.get = function(id){
        return getItem.apply(this, arguments);
    };

    this.set = function(id, values){
        return setItem.apply(this, arguments);
    };

    this.add = function(values){
        return addItem.apply(this, arguments);
    };

    this.remove = function(id){
        return removeItem.apply(this, arguments);
    };

    this.fetch = function(callbacks){
        return fetchModel.apply(this, arguments);
    };

    this.save = function(){
        return saveModel.apply(this, arguments);        
    };

    this.setDate = function(dateStr){
        return setModelDate.apply(this, arguments);        
    };
};
