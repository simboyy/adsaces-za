'use strict';

exports = module.exports = { // Can not put all settings here as this needs a restart to be applied (****verify****)
  // List of user roles
  userRoles: ['guest', 'user', 'manager', 'admin'],
  reviewSettings: {
    enabled: true, // Enables review for products
    moderate: false // If enabled, the review will be visible to public after admin approval
  },
  wishlist: true,
  mailOptions: {
    signUpAdvertiser: function signUpAdvertiser(body) {
	   
      return {
        from: 'Adspaces <admin@adspaces.co.za>',
        to: body.email,
        subject: 'Welcome to Adspaces!!',
        html: '<p><b>Thank you for registering for Adspaces.</b></br> You will find that it’s a great way to discover media options, build advertising campaigns ,make bookings and send adverts directly to  publishers with no back and forth .<br> Increase your sales and boost your profits without any significant legwork by discovering cost effective advertising media options through Adspaces.<p>Here are a few resources from our getting started section that might help you out.<br/><ul><li>Step-by-Step Guide to Your First Adspaces Campaign https://www.youtube.com/watch?v=OifS1gdXafAFAQS</li><li> What publishers can I find on Adspaces? How do I benefit ? http://www.mediabox.co.zw/index.html#faq </li></ul></p><p>Again I want to welcome you to our community. I cant wait to hear about your experience with Adspaces<br/>Enjoy redefined Convenience <br></p><p>Simbarashe Mukorera</p><p>P.S. I’m your customer support hero in charge of keeping you happy. If you have ANY questions... problems... or concerns... please feel free to reach out to ask me before getting frustrated (Phone:263 773 439 246 ,Skype: simbarashe.mukorera1, Email: admin@adspaces.co.za)</p>' // html body

      };
    },

    signUpPublisher: function signUpPublisher(body) {
      return {
        from: 'Adspaces <admin@adspaces.co.za>',
        to: body.email,
        subject: 'Welcome to Adspaces!!',
        html: '<p><b>Thank you for registering for Adspaces.</b> You will find that it’s a great way to list your media options for free , connect with advertisers from around the globe   and  receive bookings and creative directly  from  advertisers.<br> Increase your sales and boost your profits by <b>ACCESSING GLOBAL DEMAND!</b> through Adspaces.<p>Again I want to welcome you to our community. I cant wait to hear about your experience with Adspaces<br/>Enjoy redefined Convenience <br><p/><p>Simbarashe Mukorera</p><p>P.S. I’m your customer support hero in charge of keeping you happy. If you have ANY questions... problems... or concerns... please feel free to reach out to ask me before getting frustrated (Skype: simbarashe.mukorera1, Email: admin@adspaces.co.za)</p>' // html body

      };
    },
    forgotPassword: function forgotPassword(body) {
      return {
        from: 'passwordreset@adspaces.co.za',
        to: 'smkorera@gmail.com',
        subject: 'Adspaces Password Reset Request',
        html: '<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' + 'Please click on the following link, or paste this into your browser to complete the process:\n\n' + 'http://' + body.host + '/reset/' + body.token + '\n\n' + 'If you did not request this, please ignore this email and your password will remain unchanged.\n</p>'
      };
    },
    resetPassword: function resetPassword(body) {
      return {
        from: 'passwordreset@adspaces.co.za',
       to: 'smkorera@gmail.com',
        subject: 'Adspaces Password Changed',
        html: 'Hello,\n\n' + 'This is a confirmation that the password for your account ' + body.to + ' has just been changed.\n'
      };
    },
    orderPlaced: function orderPlaced(body) {
      return {
        from: 'Adspaces <billing@adspaces.co.za>',
        to: 'smkorera@gmail.com',
        subject: 'Order Placed Successfully',
        html: "Order No: " + body.orderNo + "\n Status: " + body.status + "\n\n Payment Method: " + body.payment_method + "\n\n Payment ID: " + body.id + "\n Amount: " + body.amount.total + " " + body.amount.currency + "\n\n Address: \n Name: " + body.address.recipient_name + "\n Line: " + body.address.line1 + "\n City: " + body.address.city + "\n State: " + body.address.state + "\n Zip: " + body.address.postal_code
      };
    },
    orderUpdated: function orderUpdated(body) {
      return {
        from: 'Adspaces <billing@adspaces.co.za>',
        to: 'smkorera@gmail.com',
        subject: 'Your Order Status Updated',
        html: "Order No: " + body.orderNo + "\n Status: " + body.status + "\n\n Payment Method: " + body.payment_method + "\n\n Payment ID: " + body.id + "\n Amount: " + body.amount.total + " " + body.amount.currency + "\n\n Address: \n Name: " + body.address.recipient_name + "\n Line: " + body.address.line1 + "\n City: " + body.address.city + "\n State: " + body.address.state + "\n Zip: " + body.address.postal_code + "\n "
      };
    },
    CampaignPlaced: function CampaignPlaced(body) {
	     
      return {
        from: 'Adspaces <adsn@adspaces.co.za>',
        to: 'smkorera@gmail.com',
        subject: 'New Campaign',
        html: "Your campaign has been created successfully campaign No: " + body.campaignNo

      };
    },
	CampaignPlacedPublisher: function CampaignPlacedPublisher(body) {
		
	      return {
		from: 'Adspaces <ads@adspaces.co.za>',
		to: 'smkorera@gmail.com',
		subject: 'Alert :: You have a new internet booking!',
		template:'booking',
		attachments:[{   // use URL as an attachment
		  filename: 'advert.txt',
		  path: body.creative
		 }],
		context: {
			data:body,
			date: new Date()
		
		}   

	      };
    },
    CampaignUpdated: function CampaignUpdated(body) {
      return {
        from: 'Adspaces <admin@adspaces.co.za>',
       to: 'smkorera@gmail.com',
        subject: 'Campaign Status Updated',
        html: "\nYou have recieved feedback from publisher for  campaign : " + body.campaignName + "" + "   View update on  Adspaces https://adspaces.co.za/campaign"

      };
    }
  }
};
//# sourceMappingURL=shared.js.map
