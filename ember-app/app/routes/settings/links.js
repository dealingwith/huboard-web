import CssView from 'app/views/css';
import Board from 'app/models/new/board';
import Ember from 'ember';

var SettingsLinksRoute = Ember.Route.extend({
  model: function(){
    var repo = this.modelFor("application");
    return Board.fetch(repo);
  },
  afterModel: function (model){
    if (model.get("isLoaded")) {
      return;
    }
    var cssView = CssView.create({
      content: model
    });
    cssView.appendTo("head");
  }
});

export default SettingsLinksRoute;
