var cloudscraper = require('cloudscraper');
var cheerio = require('cheerio');

var review_url = "https://www.amazon.com/product-reviews/";
var review_page = "/ref=cm_cr_arp_d_paging_btm_2?pageNumber=";


class ScrapeData {

  /**
 * Scrape every page for the reviews
 * @param {object} options - product ID of Amazon Product found in URL
 * options = {
 * "totalPages": 30,
 * "productId": "B0123"
 * }
 * @return {Promise} - promise that is resolved when cloudscraper finishes
 * scraping every page
 * object resolved:
 * object = {
 * "productId":"B01M718E9X",
 * "productName":"Coffee Maker",
 * "reviews": [{"reviewer": "", "authorLink": "", "text": ""}]
 * }
 */
  scrapeEveryPage(options) {
    return new Promise(function (resolve,reject) {
      console.log(options)
      var arrayOfReviews = [];
      var totalReviews = 0;
      var page;
      var completedRequests = 0;
      if (options.totalPages > 400) {
        console.log('setting total pages to 400')
        options.totalPages = 200;
      }
      for(page = 1; page < options.totalPages+1; page++) {
        cloudscraper.get(review_url + options.productId + review_page + page, function(error, response, body) {
          if (error) {
            console.log('Error occurred');
            console.log(error);
            reject(error);
          } else {
            var title = [];
            var review = [];
            var author = [];
            var authorLink = [];
            var rating = [];

            var $ = cheerio.load(body);
            $("a[class='a-size-base a-link-normal review-title a-color-base a-text-bold']").each(function(i, element){
                // console.log((i) + '==>' + $(this).text());
                title.push($(this).text());
            });
            $("span[class='a-size-base review-text']").each(function(i, element){
                // console.log((i) + '==>' + $(this).text());
                review.push($(this).text());
            });
            $("a[class='a-size-base a-link-normal author']").each(function(i, element){
                // console.log((i) + '==>' + $(this).text() + ' ' + $(this).attr('href'));
                author.push($(this).text());
                authorLink.push($(this).attr('href'));
            });
            $("span[class='a-icon-alt']").each(function(i, element) {
                var ratingFound = $(this).text();
                if (ratingFound != "|") {
                  rating.push(ratingFound);
                }
            });
            for(var i = 0; i < 5; i++) {
              rating.pop();
            }
            rating.reverse();
            for(var i = 0; i < 3; i++) {
              rating.pop();
            }
            rating.reverse();
            for(i = 0; i < title.length; i++) {
              var JSONObjectReview = {};
              JSONObjectReview.reviewer = author[i];
              JSONObjectReview.authorLink = authorLink[i];
              JSONObjectReview.text = review[i];
              JSONObjectReview.title = title[i];
              JSONObjectReview.rating = parseInt(rating[i]);
              arrayOfReviews.push(JSONObjectReview);
            }

            completedRequests++;
            totalReviews += title.length;
            if (completedRequests == options.totalPages) {
              console.log('Total reviews parsed: ' + totalReviews);
              var object = {};
              object.productId = options.productId;
              object.productName = options.productName;
              object.starRating = options.starRating;
              object.reviews = arrayOfReviews;
              resolve(object);
            }
          }
        });
      }
    });
  }

  /**
   * Scrape for Number of Pages in first page
   * @param {String} productId - product ID of Amazon Product found in URL
   * @return {Promise} - promise that is resolved when cloudscraper returns
   * a result.
   * object resolved:
   * object = {
   * "productId" = "B0123",
   * "totalPages" : 30
   * }
   */
  scrapeNumberOfPages(productId) {
    return new Promise(function (resolve, reject) {
      cloudscraper.get(review_url + productId + review_page + 1, function(error, response, body) {
        if (error) {
          console.log('getting error with scraping')
            return console.error(error);
        } else {
          var pageList = [];
          var $ = cheerio.load(body);
          var amazonRating = 0;
          $("li[class='page-button']").each(function(i, element){
              pageList.push(parseInt($(this).text().replace(",","")));
          });
          var starRating = $("span .arp-rating-out-of-text").text();
          var object = {};
          object.productName = $("title").text().replace("Amazon.com: Customer reviews: ","");
          object.starRating = starRating;
          console.log(object.productName + " <== GETTING REVIEWS OF");
          object.totalPages = pageList.pop();
          if(object.totalPages == undefined)
            object.totalPages = 1;
          console.log('object.totalPages: ');
          console.log(object.totalPages);
          object.productId = productId;
          resolve(object);
        }
      });
    });
  }
}

module.exports = ScrapeData;