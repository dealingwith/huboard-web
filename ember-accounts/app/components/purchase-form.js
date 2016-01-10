import Ember from 'ember';
import CreditCardForm from './credit-card-form';

export default CreditCardForm.extend({
  coupon: null,
  isDisabled: function() {
    this.get('isProcessing') || this.get('errors');
  }.property('isProcessing', 'errors'),
  clearErrors: function() {
    this.set('errors', null);
  }.observes('number', 'cvc', 'expMonth', 'expYear'),
  onCouponChange: function() {
    const errors = this.get('errors');
    if (errors) {
      return this.set('errors', null);
    }
  }.observes('coupon'),
  price: function() {
    return this.get('model.amount');
  }.property('plan.amount'),
  didProcessToken(status, response) {
    if (response.error) {
      this.set('processingCard', false);
      return this.set('errors', response.error.message);
    } else {
      return this.postCharge(response);
    }
  },
  postCharge(token) {
    return this.ajax('/settings/charge/' + this.get('model.org.login'), {
      email: this.get('model.org.billing_email'),
      card: token,
      coupon: this.get('coupon'),
      plan: this.get('model.plan'),
    }).then(this.didPurchase.bind(this), this.purchaseDidError.bind(this));
  },
  didPurchase(response) {
    if (this.get('trialing')) {
      this.set('plan.status', 'purchase_with_trial');
    } else {
      this.set('plan.status', 'active');
    }

    this.set('processingCard', false);
    this.set('model.details.account_email', this.get('model.org.billing_email'));
    this.set('model.details.card', response.card);
    this.set('model.details.discount', response.discount);
    this.set('model.plan.purchased', true);
    this.set('model.details.has_plan', true);
    return this.sendAction('close');
  },
  purchaseDidError(error) {
    this.set('errors', JSON.parse(error.responseText).error.message);
    return this.set('processingCard', false);
  },
  didRejectCoupon(error, statusText) {
    return this.set('errors', JSON.parse(error.responseText).error.message);
  },
  clearCouponAlerts() {
    return this.set('errors', null);
  },
  ajax(url, data, verb) {
    return new Ember.RSVP.Promise((resolve, reject) => {
      var hash;
      hash = {};
      hash.url = url;
      hash.type = verb || 'POST';
      hash.context = this;
      hash.data = data;
      hash.success = function(json) {
        return resolve(json);
      };
      hash.error = function(jqXHR, textStatus, errorThrown) {
        return reject(jqXHR);
      };
      return Ember.$.ajax(hash);
    });
  },
  plan: function() {
    let plans = this.get("model.details.plans")
    this.set("model.details.plans", Em.A(plans));
    return this.get("model.details.plans.firstObject");
  }.property('model.details.plans'),
  trialing: function() {
    return this.get('plan.status') === 'trialing' && !this.get('trialExpired');
  }.property('plan.status', 'trialExpired'),
  trialExpired: function() {
    const end_time = new Date(this.get('plan.trial_end') * 1000);
    let now = new Date();
    return (end_time - now) < 1;
  }.property('plan.trial_end'),
  actions: {
    couponChanged() {
      let success;
      const coupon_id = this.get('coupon');
      if (coupon_id === "") {
        return this.clearCouponAlerts();
      }

      return this.ajax('/settings/coupon_valid/' + coupon_id, {}, "GET").then(() => {}, this.didRejectCoupon.bind(this));
    },
    close() {
      return this.sendAction('close');
    }
  }
});
