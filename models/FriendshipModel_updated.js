const db = require("../config/db");
const NotificationModel = require("./NotificationModel");

class FriendshipModel {
  // جلب الأصدقاء المقبولين
  static getAcceptedFriends(userId, offset = 0, limit = 10) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.*, u.last_active, u.is_active
        FROM users u
        WHERE u.id IN (SELECT friend_id FROM friendships WHERE user_id = ? AND status = 'accepted')
        ORDER BY u.last_active DESC
        LIMIT ?, ?
      `;
      db.query(query, [userId, offset, limit], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // جلب طلبات الصداقة الواردة
  static getFriendRequests(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT fr.id, fr.sender_id, u.name AS sender_name, u.avatar AS sender_avatar, fr.is_read, fr.created_at
        FROM friend_requests fr
        JOIN users u ON fr.sender_id = u.id 
        WHERE fr.receiver_id = ? AND fr.status = 'pending'
        ORDER BY fr.created_at DESC
      `;
      db.query(query, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // جلب المستخدمين المحظورين
  static getBlockedFriends(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.* 
        FROM users u
        WHERE u.id IN (SELECT blocked_user_id FROM blocked_users WHERE user_id = ?)
        ORDER BY u.name ASC
      `;
      db.query(query, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // جلب جميع المستخدمين عدا الحالي والأصدقاء والمحظورين
  static getAllUsersExceptCurrent(userId, offset = 0, limit = 10) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.id, u.name, u.avatar, u.last_active, u.is_active, u.country, u.age, u.language
        FROM users u
        WHERE u.id != ? AND u.is_active = 1
        AND u.id NOT IN (
          SELECT receiver_id FROM friend_requests WHERE sender_id = ? AND status = 'pending'
          UNION
          SELECT sender_id FROM friend_requests WHERE receiver_id = ? AND status = 'pending'
          UNION
          SELECT friend_id FROM friendships WHERE user_id = ? AND status = 'accepted'
          UNION
          SELECT blocked_user_id FROM blocked_users WHERE user_id = ?
          UNION
          SELECT user_id FROM blocked_users WHERE blocked_user_id = ?
        )
        ORDER BY u.name ASC
        LIMIT ?, ?
      `;
      db.query(query, [userId, userId, userId, userId, userId, userId, offset, limit], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // إرسال طلب صداقة
  static async sendFriendRequest(userId, friendId) {
    return new Promise((resolve, reject) => {
      // التحقق من صحة البيانات
      if (!userId || !friendId || userId === friendId) {
        return reject(new Error("بيانات غير صحيحة"));
      }

      // التحقق من وجود صداقة أولاً
      const checkFriendshipQuery = `
        SELECT * FROM friendships 
        WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
      `;
      
      db.query(checkFriendshipQuery, [userId, friendId, friendId, userId], (err, friendshipResults) => {
        if (err) return reject(err);
        
        if (friendshipResults.length > 0) {
          // إذا وجدت صداقة، نحذفها أولاً ثم نسمح بإرسال طلب جديد
          const deleteFriendshipQuery = `
            DELETE FROM friendships 
            WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
          `;
          
          db.query(deleteFriendshipQuery, [userId, friendId, friendId, userId], (deleteErr) => {
            if (deleteErr) return reject(deleteErr);
            
            // حذف أي طلبات صداقة سابقة أيضاً
            const deleteRequestsQuery = `
              DELETE FROM friend_requests 
              WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
            `;
            
            db.query(deleteRequestsQuery, [userId, friendId, friendId, userId], (deleteReqErr) => {
              if (deleteReqErr) return reject(deleteReqErr);
              
              // المتابعة مع إنشاء طلب جديد
              createNewRequest();
            });
          });
        } else {
          // لا توجد صداقة، نتابع مباشرة
          createNewRequest();
        }
      });

      function createNewRequest() {
        // التحقق من وجود طلب صداقة سابق
        const checkExistingQuery = `
          SELECT * FROM friend_requests 
          WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
          ORDER BY created_at DESC
          LIMIT 1
        `;
        
        db.query(checkExistingQuery, [userId, friendId, friendId, userId], (err, existingResults) => {
          if (err) return reject(err);

          if (existingResults.length > 0) {
            const existingRequest = existingResults[0];
            if (existingRequest.status === 'pending') {
              if (existingRequest.sender_id === userId) {
                return reject(new Error("لقد أرسلت طلب صداقة لهذا المستخدم بالفعل"));
              } else {
                return reject(new Error("لديك طلب صداقة معلق من هذا المستخدم"));
              }
            }
            // إذا كان الطلب السابق مرفوض أو مقبول، نحذفه ونسمح بإرسال طلب جديد
          }

          // التحقق من الحظر
          const checkBlockQuery = `
            SELECT * FROM blocked_users 
            WHERE (user_id = ? AND blocked_user_id = ?) OR (user_id = ? AND blocked_user_id = ?)
          `;
          
          db.query(checkBlockQuery, [userId, friendId, friendId, userId], (err, blockResults) => {
            if (err) return reject(err);
            
            if (blockResults.length > 0) {
              return reject(new Error("لا يمكن إرسال طلب صداقة لمستخدم محظور أو قام بحظرك"));
            }

            // حذف أي طلبات سابقة أولاً
            const deleteRejectedQuery = `
              DELETE FROM friend_requests 
              WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
            `;
            
            db.query(deleteRejectedQuery, [userId, friendId, friendId, userId], (err) => {
              if (err) return reject(err);

              // إنشاء طلب صداقة جديد
              const insertQuery = `
                INSERT INTO friend_requests (sender_id, receiver_id, status, is_read, created_at)
                VALUES (?, ?, 'pending', 0, NOW())
              `;
              
              db.query(insertQuery, [userId, friendId], (err, results) => {
                if (err) {
                  // إذا كان هناك خطأ duplicate entry، نحاول حذف الطلب القديم أولاً
                  if (err.code === 'ER_DUP_ENTRY') {
                    const deleteQuery = `
                      DELETE FROM friend_requests 
                      WHERE sender_id = ? AND receiver_id = ?
                    `;
                    
                    db.query(deleteQuery, [userId, friendId], (deleteErr) => {
                      if (deleteErr) return reject(deleteErr);
                      
                      // إعادة المحاولة
                      db.query(insertQuery, [userId, friendId], (retryErr, retryResults) => {
                        if (retryErr) return reject(retryErr);
                        resolve(retryResults);
                      });
                    });
                  } else {
                    return reject(err);
                  }
                } else {
                  resolve(results);
                }
              });
            });
          });
        });
      }
    });
  }

  // قبول طلب صداقة
  static async acceptFriendRequest(requestId, receiverId) {
    return new Promise((resolve, reject) => {
      // بدء المعاملة
      db.beginTransaction(err => {
        if (err) return reject(err);

        const getRequestQuery = `
          SELECT sender_id, receiver_id FROM friend_requests 
          WHERE id = ? AND receiver_id = ? AND status = 'pending'
          FOR UPDATE
        `;
        
        db.query(getRequestQuery, [requestId, receiverId], async (err, results) => {
          if (err) {
            return db.rollback(() => reject(err));
          }
          
          if (results.length === 0) {
            return db.rollback(() => reject(new Error("طلب الصداقة غير موجود أو ليس لك")));
          }

          const { sender_id, receiver_id } = results[0];

          try {
            // التحقق من عدد الأصدقاء
            const senderFriendsCount = await this.getFriendsCount(sender_id);
            const receiverFriendsCount = await this.getFriendsCount(receiver_id);

            if (senderFriendsCount >= 20) {
              return db.rollback(() => reject(new Error("المرسل وصل للحد الأقصى لعدد الأصدقاء (20)")));
            }
            if (receiverFriendsCount >= 20) {
              return db.rollback(() => reject(new Error("لقد وصلت للحد الأقصى لعدد الأصدقاء (20)")));
            }

            // التحقق من وجود صداقة سابقة
            const checkFriendshipQuery = `
              SELECT * FROM friendships 
              WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
            `;
            
            db.query(checkFriendshipQuery, [sender_id, receiver_id, receiver_id, sender_id], (err, friendshipResults) => {
              if (err) {
                return db.rollback(() => reject(err));
              }

              if (friendshipResults.length > 0) {
                return db.rollback(() => reject(new Error("أنتما صديقان بالفعل")));
              }

              // تحديث حالة الطلب
              const updateRequestQuery = `
                UPDATE friend_requests 
                SET status = 'accepted', is_read = 1, updated_at = NOW() 
                WHERE id = ?
              `;
              
              db.query(updateRequestQuery, [requestId], (err) => {
                if (err) {
                  return db.rollback(() => reject(err));
                }

                // إضافة الصداقة في الاتجاهين
                const insertFriendshipQuery = `
                  INSERT INTO friendships (user_id, friend_id, status, created_at)
                  VALUES (?, ?, 'accepted', NOW()), (?, ?, 'accepted', NOW())
                `;
                
                db.query(insertFriendshipQuery, [sender_id, receiver_id, receiver_id, sender_id], (err) => {
                  if (err) {
                    return db.rollback(() => reject(err));
                  }

                  // تأكيد المعاملة
                  db.commit(err => {
                    if (err) {
                      return db.rollback(() => reject(err));
                    }
                    resolve({ senderId: sender_id, receiverId: receiver_id });
                  });
                });
              });
            });
          } catch (error) {
            return db.rollback(() => reject(error));
          }
        });
      });
    });
  }

  // رفض طلب صداقة
  static rejectFriendRequest(requestId, receiverId) {
    return new Promise((resolve, reject) => {
      const getRequestQuery = `
        SELECT sender_id, receiver_id FROM friend_requests 
        WHERE id = ? AND receiver_id = ? AND status = 'pending'
      `;
      
      db.query(getRequestQuery, [requestId, receiverId], (err, results) => {
        if (err) return reject(err);
        if (results.length === 0) return reject(new Error("طلب الصداقة غير موجود أو ليس لك"));

        const updateRequestQuery = `UPDATE friend_requests SET status = 'rejected', is_read = 1 WHERE id = ?`;
        db.query(updateRequestQuery, [requestId], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }

  // إلغاء طلب صداقة مرسل
  static cancelFriendRequest(userId, friendId) {
    return new Promise((resolve, reject) => {
      const deleteQuery = `
        DELETE FROM friend_requests 
        WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
      `;
      
      db.query(deleteQuery, [userId, friendId], (err, result) => {
        if (err) return reject(err);
        if (result.affectedRows === 0) return reject(new Error("لا يوجد طلب صداقة لإلغائه"));
        resolve();
      });
    });
  }

  // حظر مستخدم
  static blockFriend(userId, friendId) {
    return new Promise((resolve, reject) => {
      // إضافة إلى قائمة المحظورين
      const blockQuery = `
        INSERT INTO blocked_users (user_id, blocked_user_id, created_at) 
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE created_at = NOW()
      `;
      
      db.query(blockQuery, [userId, friendId], (err) => {
        if (err) return reject(err);

        // حذف الصداقة إن وجدت
        const deleteFriendshipQuery = `
          DELETE FROM friendships 
          WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
        `;
        
        db.query(deleteFriendshipQuery, [userId, friendId, friendId, userId], (err) => {
          if (err) return reject(err);

          // حذف طلبات الصداقة المعلقة
          const deleteRequestsQuery = `
            DELETE FROM friend_requests 
            WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
            AND status = 'pending'
          `;
          
          db.query(deleteRequestsQuery, [userId, friendId, friendId, userId], (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });
    });
  }

  // إلغاء حظر مستخدم
  static unblockFriend(userId, friendId) {
    return new Promise((resolve, reject) => {
      const query = `
        DELETE FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?
      `;
      
      db.query(query, [userId, friendId], (err, result) => {
        if (err) return reject(err);
        if (result.affectedRows === 0) return reject(new Error("المستخدم ليس محظوراً"));
        resolve();
      });
    });
  }

  // إزالة صديق
  static removeFriend(userId, friendId) {
    return new Promise((resolve, reject) => {
      // بدء المعاملة
      db.beginTransaction(err => {
        if (err) return reject(err);

        // حذف من جدول friendships
        const deleteFriendshipQuery = `
          DELETE FROM friendships 
          WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
        `;
        
        db.query(deleteFriendshipQuery, [userId, friendId, friendId, userId], (err, result) => {
          if (err) {
            return db.rollback(() => reject(err));
          }

          // حذف من جدول friend_requests أيضاً
          const deleteRequestsQuery = `
            DELETE FROM friend_requests 
            WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
          `;
          
          db.query(deleteRequestsQuery, [userId, friendId, friendId, userId], (err) => {
            if (err) {
              return db.rollback(() => reject(err));
            }

            // تأكيد المعاملة
            db.commit(err => {
              if (err) {
                return db.rollback(() => reject(err));
              }
              resolve();
            });
          });
        });
      });
    });
  }

  // عدد الأصدقاء
  static getFriendsCount(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) AS count FROM friendships WHERE user_id = ? AND status = 'accepted'
      `;
      db.query(query, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    });
  }

  // جلب ملف المستخدم
  static getUserProfile(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.*, 
               (SELECT COUNT(*) FROM likes WHERE friend_id = u.id) AS likes,
               FLOOR((SELECT COUNT(*) FROM likes WHERE friend_id = u.id) / 3) AS ranking
        FROM users u 
        WHERE u.id = ?
      `;
      db.query(query, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  }

  // التحقق من حالة الصداقة
  static checkFriendship(userId, friendId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT status FROM friendships 
        WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
      `;
      db.query(query, [userId, friendId, friendId, userId], (err, results) => {
        if (err) reject(err);
        else resolve(results.length > 0 ? results[0].status : null);
      });
    });
  }

  // البحث عن المستخدمين
  static searchUsers(userId, searchQuery) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT u.id, u.name, u.avatar, u.is_active, u.country, u.age, u.language,
          CASE 
            WHEN f.status = 'accepted' THEN 'friend'
            WHEN fr.status = 'pending' AND fr.sender_id = ? THEN 'request_sent'
            WHEN fr.status = 'pending' AND fr.receiver_id = ? THEN 'request_received'
            WHEN bu.blocked_user_id IS NOT NULL THEN 'blocked'
            WHEN bu2.user_id IS NOT NULL THEN 'blocked_by'
            ELSE 'not_friend'
          END AS friendship_status
        FROM users u
        LEFT JOIN friendships f ON (f.user_id = u.id AND f.friend_id = ?) OR (f.user_id = ? AND f.friend_id = u.id)
        LEFT JOIN friend_requests fr ON (fr.sender_id = u.id AND fr.receiver_id = ?) OR (fr.receiver_id = u.id AND fr.sender_id = ?)
        LEFT JOIN blocked_users bu ON bu.user_id = ? AND bu.blocked_user_id = u.id
        LEFT JOIN blocked_users bu2 ON bu2.user_id = u.id AND bu2.blocked_user_id = ?
        WHERE u.id != ? AND (u.name LIKE ? OR u.email LIKE ?) AND u.is_active = 1
        ORDER BY u.name ASC
        LIMIT 10
      `;
      db.query(query, [userId, userId, userId, userId, userId, userId, userId, userId, userId, `%${searchQuery}%`, `%${searchQuery}%`], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // عدد طلبات الصداقة غير المقروءة
  static getUnreadFriendRequestsCount(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) AS unread_count 
        FROM friend_requests 
        WHERE receiver_id = ? AND status = 'pending' AND is_read = 0
      `;
      db.query(query, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].unread_count || 0);
      });
    });
  }

  // تحديث آخر نشاط
  static updateLastActive(userId) {
    return new Promise((resolve, reject) => {
      const query = `UPDATE users SET last_active = NOW() WHERE id = ?`;
      db.query(query, [userId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // التحقق من حالة طلب الصداقة
  static checkFriendRequestStatus(userId, friendId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT status, sender_id 
        FROM friend_requests 
        WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
        ORDER BY created_at DESC
        LIMIT 1
      `;
      db.query(query, [userId, friendId, friendId, userId], (err, results) => {
        if (err) reject(err);
        else resolve(results.length > 0 ? results[0] : null);
      });
    });
  }

  // التحقق من الحظر
  static isUserBlocked(userId, blockedUserId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) AS count FROM blocked_users 
        WHERE user_id = ? AND blocked_user_id = ?
      `;
      db.query(query, [userId, blockedUserId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count > 0);
      });
    });
  }

  // التحقق من كون المستخدم مرسل الطلب
  static isSender(userId, friendId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT COUNT(*) AS count FROM friend_requests 
        WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
      `;
      db.query(query, [userId, friendId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count > 0);
      });
    });
  }

  // جلب وقت آخر طلب صداقة
  static getLastRequestTime(userId, friendId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT created_at FROM friend_requests 
        WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
        ORDER BY created_at DESC
        LIMIT 1
      `;
      db.query(query, [userId, friendId, friendId, userId], (err, results) => {
        if (err) reject(err);
        else resolve(results.length > 0 ? results[0].created_at : null);
      });
    });
  }

  // التحقق من الإعجاب
  static async hasUserLiked(userId, friendId) {
    return new Promise((resolve, reject) => {
      const query = `SELECT COUNT(*) AS count FROM likes WHERE user_id = ? AND friend_id = ?`;
      db.query(query, [userId, friendId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count > 0);
      });
    });
  }

  // جلب طلب صداقة بواسطة المرسل
  static getFriendRequestBySender(receiverId, senderId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT fr.id, u.name AS sender_name, u.avatar AS sender_avatar
        FROM friend_requests fr
        JOIN users u ON fr.sender_id = u.id
        WHERE fr.receiver_id = ? AND fr.sender_id = ? AND fr.status = 'pending'
        ORDER BY fr.created_at DESC
        LIMIT 1
      `;
      db.query(query, [receiverId, senderId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  }

  // جلب طلب صداقة بواسطة المعرف
  static getFriendRequestById(requestId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT fr.id, fr.sender_id, fr.receiver_id
        FROM friend_requests fr
        WHERE fr.id = ?
      `;
      db.query(query, [requestId], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });
  }

  // جلب حالة العلاقة بين مستخدمين
  static getRelationshipStatus(userId, targetUserId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          CASE 
            WHEN f.status = 'accepted' THEN 'friend'
            WHEN fr.status = 'pending' AND fr.sender_id = ? THEN 'request_sent'
            WHEN fr.status = 'pending' AND fr.receiver_id = ? THEN 'request_received'
            WHEN bu.blocked_user_id IS NOT NULL THEN 'blocked'
            WHEN bu2.user_id IS NOT NULL THEN 'blocked_by'
            ELSE 'not_friend'
          END AS relationship_status,
          fr.id AS request_id
        FROM users u
        LEFT JOIN friendships f ON (f.user_id = u.id AND f.friend_id = ?) OR (f.user_id = ? AND f.friend_id = u.id)
        LEFT JOIN friend_requests fr ON (fr.sender_id = u.id AND fr.receiver_id = ?) OR (fr.receiver_id = u.id AND fr.sender_id = ?)
        LEFT JOIN blocked_users bu ON bu.user_id = ? AND bu.blocked_user_id = u.id
        LEFT JOIN blocked_users bu2 ON bu2.user_id = u.id AND bu2.blocked_user_id = ?
        WHERE u.id = ?
      `;
      
      db.query(query, [
        userId, userId, userId, targetUserId, targetUserId, userId,
        userId, targetUserId, targetUserId, userId, targetUserId
      ], (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || { relationship_status: 'not_friend', request_id: null });
      });
    });
  }
}

module.exports = FriendshipModel;

