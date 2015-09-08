import Ember from 'ember';
import Model from '../model';
import correlationId from 'app/utilities/correlation-id';

var Issue = Model.extend({
  columnIndex: Ember.computed.alias("data.current_state.index"),
  order: Ember.computed.alias("data._data.order"),
  milestoneOrder: Ember.computed.alias("data._data.milestone_order"),
  milestoneTitle: Ember.computed.alias("milestone.title"),
  correlationId: correlationId,
  assignee: Ember.computed.alias("data.assignee"),
  apiUrl: function(){
    var full_name = this.get("repo.data.repo.full_name");
    return `/api/${full_name}/issues/${this.get("data.number")}`;
  }.property("data.number", "repo.data.repo.full_name"),

  loadDetails: function () {
    this.set("processing", true);
    return Ember.$.getJSON(`${this.get("apiUrl")}/details`)
    .success(function(details){
      this.set("data.repo", details.repo);
      this.set("data.activities", details.activities);
      this.set("processing", false);
    }.bind(this)).fail(function(){
      this.set("processing", false);
    }.bind(this));
  },
  updateLabels : function () {
    this.set("processing", true);
    return Ember.$.ajax( {
      url: `${this.get("apiUrl")}`,
      data: JSON.stringify({
        labels: this.serialize(["repo"]).data.other_labels,
        correlationId: this.get("correlationId")
      }),
      dataType: 'json',
      type: "PUT",
      contentType: "application/json"})
      .then(function(){
        this.set("processing", false);
      }.bind(this));
  },
  reorder: function (index, column) {
    var changedColumns = this.get("data.current_state.index") !== column.data.index;
    if(changedColumns){ this.set("data._data.custom_state", ""); }

    this.set("data.current_state", column.data);
    this.set("data._data.order", index);

    var full_name = this.get("repo.data.repo.full_name");
    return Ember.$.post("/api/" + full_name + "/dragcard", {
      number : this.get("data.number"),
      order: index.toString(),
      column: column.data.index.toString(),
      moved_columns: changedColumns,
      correlationId: this.get("correlationId")
    }, function( response ){
      this.set("data.body", response.body);
      this.set("data.body_html", response.body_html);
      return this;
    }.bind(this), "json");
  },
  customState: Ember.computed("_data.custom_state", {
    get:function(){
      return this.get("_data.custom_state");
    },
    set: function (key, value) {
      var previousState = this.get("_data.custom_state")
      this.set("_data.custom_state", value);

      var endpoint = value === "" ? previousState : value;
      var number = this.get("data.number");
      var options = {
        dataType: "json",
        data: {correlationId: this.get("correlationId")},
        type: value === "" ? "DELETE" : "PUT",
        url: `${this.get("apiUrl")}/${endpoint}`
      };

      this.set("processing", true);
      Ember.$.ajax(options)
      .then(function(response){
        this.set("processing", false);
        this.set("data.body", response.body);
        this.set("data.body_html", response.body_html);
      }.bind(this));

      return value;
    },
  }),
});

export default Issue;
