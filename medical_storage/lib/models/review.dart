import 'package:medical_storage/models/user.dart';

class Review {
  final int? id;
  final int? userId;
  final User? user;
  final int rating;
  final String? comment;
  final int? doctorId;
  final int? medicineId;
  final bool? isPositiveReview;
  final bool? isNegativeReview;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Review({
    this.id,
    this.userId,
    this.user,
    required this.rating,
    this.comment,
    this.doctorId,
    this.medicineId,
    this.isPositiveReview,
    this.isNegativeReview,
    this.createdAt,
    this.updatedAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id'],
      userId: json['userId'],
      user: json['user'] != null ? User.fromJson(json['user']) : null,
      rating: json['rating'] ?? 0,
      comment: json['comment'],
      doctorId: json['doctorId'],
      medicineId: json['medicineId'],
      isPositiveReview: json['isPositiveReview'],
      isNegativeReview: json['isNegativeReview'],
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'rating': rating,
      'comment': comment,
      'doctorId': doctorId,
      'medicineId': medicineId,
    };
  }
}