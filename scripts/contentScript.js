(function () {
   chrome.storage.local.get(["options"], (st) => {

      if (!!st.options && !!st.options.enableExt) {
         let action_step = -1;
         let currentLeague = "";

         let row_catcher_interval = undefined;
         let row_reader_interval = undefined;
         let stack_of_rows = [];
         let collected_rows = {};

         function getDifficulty(lvls) {
            if (lvls.green > 0) {
               return "green";
            } else if (lvls.yellow > 0) {
               return "yellow";
            } else if (lvls.red > 0) {
               return "red";
            } else {
               return "gray";
            }
         };

         function addLvlsToCell(element, lvls) {
            chrome.storage.local.get(['options'], (st) => {
               let displayBar = false;
               if (!!st.options) {
                  if (("displayBar" in st.options)) {
                     displayBar = st.options.displayBar;
                     console.log(displayBar);
                  }
               }

               let barElement = ``;
               let cellWrapperClass = `sharkhunter_lvls_cells`;
               if (displayBar) {
                  const difficulty = getDifficulty(lvls);
                  cellWrapperClass = `sharkhunter_lvls_cells-2`;
                  barElement = `
            <div class="sharkhunter_lvl-bar-wrapper">
                  <div class="sharkhunter_lvl-bar ${difficulty}"></div>
                  </div>
                  `;
               }

               $(element).addClass('sharkhunter_lvls-cell');
               const html = `
         <div class="sharkhunter_cells-wrapper">
         ${barElement}
         <div class="${cellWrapperClass}">
         <div class="sharkhunter_lvls_cells__red">${lvls.red}</div>
         <div class="sharkhunter_lvls_cells__yellow">${lvls.yellow}</div>
         <div class="sharkhunter_lvls_cells__green">${lvls.green}</div>
         </div>
         </div>
         `;
               $(element).append(html);
            });
         }

         function rowCatcher() {
            $('.grid-canvas .slick-row:not(.sharkhunter_parsed)').each(function () {
               let row_id_cell = $(this).find('.slick-cell.r4 a');
               let row_id = row_id_cell.attr('onclick');
               if (!stack_of_rows.includes(row_id)) {
                  stack_of_rows.push(row_id);
               }
            });
         }

         function rowReader() {
            if (stack_of_rows.length > 0) {
               const row_id = stack_of_rows[0];
               stack_of_rows.shift();

               const row = $(`.grid-canvas .slick-cell.r4 a[onclick="${row_id}"]`);
               if (!!row) {
                  if (!(row_id in collected_rows)) {
                     collected_rows[row_id] = null;
                     setTimeout(() => {
                        const [base, group_id, template_id] = /return draftKingsMain\.H2HContestPop\((\d{1,}), (\d{1,}), true\);/g.exec(row_id);
                        const url = `https://www.draftkings.com/lobby/headtoheadmodal?contestTemplateId=${template_id}&draftGroupId=${group_id}&defaultToDetails=true`;

                        $.ajax({
                           url
                        }).done((r) => {
                           let opponents_lvls = { green: 0, yellow: 0, red: 0 };
                           const opponents = $(r).find('.opponents-list li');
                           opponents.each((i, e) => {
                              // if there are no oponents, we don't count
                              if ($(e).attr('class') == "no-contests") {
                                 return;
                              }

                              const opponent_lvl = $(e).find('span span').attr('class');
                              if (opponent_lvl == undefined || opponent_lvl == "icon-experienced-user-1") {
                                 opponents_lvls.green++;
                              } else if (opponent_lvl == "icon-experienced-user-2" || opponent_lvl == "icon-experienced-user-3") {
                                 opponents_lvls.yellow++;
                              } else if (opponent_lvl == "icon-experienced-user-4" || opponent_lvl == "icon-experienced-user-5") {
                                 opponents_lvls.red++;
                              }
                           });
                           addLvlsToCell(row.parent(), opponents_lvls);
                           collected_rows[row_id] = opponents_lvls;
                           row.parent().parent().addClass('sharkhunter_parsed');

                        }).fail(() => {
                           delete collected_rows[row_id];
                           //nothing
                        });
                     }, 0);
                  } else {
                     if (!!collected_rows[row_id] && !row.parent().hasClass('sharkhunter_lvls-cell')) {
                        addLvlsToCell(row.parent(), collected_rows[row_id]);
                        row.parent().parent().addClass('sharkhunter_parsed');
                        //console.log();
                     }
                  }
               }
            }
         }

         let action_interval = setInterval(() => {
            // are we in the same League?
            const selectedLeague = $('#dkjs-subnav .SubNav_item.SubNav_selected a');
            const selectedTable = $('.lobby-left-nav .selected');

            const isDifferentLeague = !!selectedLeague && currentLeague != selectedLeague.text();
            const isHeadToHeadTable = !!selectedTable && selectedTable.text() == "Head to Head";

            if (isDifferentLeague || !isHeadToHeadTable) {
               currentLeague = selectedLeague.text();
               action_step = 0;
            }

            switch (action_step) {
               case 0:
                  clearInterval(row_catcher_interval);
                  clearInterval(row_reader_interval);
                  stack_of_rows = [];
                  collected_rows = [];
                  action_step++;
                  break;

               case 1:
                  // is table loaded?
                  let table_header_field = $('.slick-header-column:nth-child(2) span');
                  if (!!table_header_field && table_header_field.text() == "Contest Group") {
                     row_catcher_interval = setInterval(rowCatcher, 300);
                     row_reader_interval = setInterval(rowReader, 150);
                     action_step++;
                  }
                  break;

               case 2:
                  break;
            }

         }, 300);


      }
   });
})();