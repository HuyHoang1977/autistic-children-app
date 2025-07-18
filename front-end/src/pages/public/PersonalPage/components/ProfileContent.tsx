import React from 'react';
import { PersonalProfile } from '../../../../api/services/personal.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { User, Award, Users, Star } from 'lucide-react';

interface ProfileContentProps {
  profile: PersonalProfile;
  articleStats: any;
  followStats: any;
}

const ProfileContent: React.FC<ProfileContentProps> = ({ profile, articleStats, followStats }) => {
  return (
    <div className="space-y-6">
      {/* Basic User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Thông tin cá nhân
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <strong>Họ và tên:</strong>
              <p className="text-gray-600">{profile.full_name}</p>
            </div>
            <div>
              <strong>Email:</strong>
              <p className="text-gray-600">{profile.email}</p>
            </div>
            <div>
              <strong>Tên người dùng:</strong>
              <p className="text-gray-600">{profile.username}</p>
            </div>
            <div>
              <strong>Số điện thoại:</strong>
              <p className="text-gray-600">{profile.phone || 'Chưa cung cấp'}</p>
            </div>
            <div>
              <strong>Ngày tham gia:</strong>
              <p className="text-gray-600">{new Date(profile.created_at).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Doctor Information */}
      {profile.user_type === 'doctor' && profile.doctor_info && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Thông tin bác sĩ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <strong>Số giấy phép hành nghề:</strong>
                <p className="text-gray-600">{profile.doctor_info.license_number || 'Chưa cung cấp'}</p>
              </div>
              <div>
                <strong>Chuyên khoa:</strong>
                <p className="text-gray-600">{profile.doctor_info.specialty || 'Chưa xác định'}</p>
              </div>
              <div>
                <strong>Số năm kinh nghiệm:</strong>
                <p className="text-gray-600">{profile.doctor_info.years_experience || 0} năm</p>
              </div>
              <div>
                <strong>Tên phòng khám:</strong>
                <p className="text-gray-600">{profile.doctor_info.clinic_name || 'Chưa cung cấp'}</p>
              </div>
              <div>
                <strong>Địa chỉ phòng khám:</strong>
                <p className="text-gray-600">{profile.doctor_info.clinic_address || 'Chưa cung cấp'}</p>
              </div>
              <div>
                <strong>Đánh giá trung bình:</strong>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${
                          star <= (profile.doctor_info?.rating || 0) 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300'
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {profile.doctor_info.rating ? `${profile.doctor_info.rating}/5` : 'Chưa có đánh giá'}
                  </span>
                </div>
              </div>
            </div>
            {profile.doctor_info.bio && (
              <div className="mt-6 pt-4 border-t">
                <strong>Giới thiệu bản thân:</strong>
                <p className="text-gray-600 mt-2 leading-relaxed">{profile.doctor_info.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Parent Information */}
      {profile.user_type === 'parent' && profile.parent_info && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Thông tin phụ huynh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <strong>Số điện thoại:</strong>
                <p className="text-gray-600">{profile.phone || 'Chưa cung cấp'}</p>
              </div>
              <div>
                <strong>Số lượng con:</strong>
                <p className="text-gray-600">{profile.children_count || profile.parent_info.number_of_children || 0} con</p>
              </div>
              <div>
                <strong>Thông tin con em:</strong>
                <p className="text-gray-600">{profile.parent_info.children_info || 'Chưa có thông tin'}</p>
              </div>
              <div>
                <strong>Mối quan tâm nuôi dạy:</strong>
                <p className="text-gray-600">{profile.parent_info.parenting_concerns || 'Chưa có thông tin'}</p>
              </div>
              <div>
                <strong>Hoạt động lần cuối:</strong>
                <p className="text-gray-600">
                  {profile.parent_info.last_activity 
                    ? new Date(profile.parent_info.last_activity).toLocaleDateString('vi-VN') 
                    : 'Chưa có thông tin'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Children Information for Parents */}
      {profile.user_type === 'parent' && profile.children && profile.children.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Thông tin con em
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profile.children.map((child: any) => (
                <div key={child.child_id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{child.name}</h4>
                    </div>
                    <Badge variant="outline" className="bg-blue-50">
                      {child.age} tuổi
                    </Badge>
                  </div>
                  
                  <div className="grid gap-3 md:grid-cols-2 text-sm">
                    <div>
                      <strong>Giới tính:</strong>
                      <p className="text-gray-600">{child.gender === 'male' ? 'Nam' : 'Nữ'}</p>
                    </div>
                    <div>
                      <strong>Ngày sinh:</strong>
                      <p className="text-gray-600">{new Date(child.birth_date).toLocaleDateString('vi-VN')}</p>
                    </div>
                    
                    {child.weight && (
                      <div>
                        <strong>Cân nặng:</strong>
                        <p className="text-gray-600">{child.weight} kg</p>
                      </div>
                    )}
                    
                    {child.height && (
                      <div>
                        <strong>Chiều cao:</strong>
                        <p className="text-gray-600">{child.height} cm</p>
                      </div>
                    )}
                  </div>
                  
                  {child.medical_history && (
                    <div className="mt-3 pt-3 border-t">
                      <strong>Tiền sử bệnh:</strong>
                      <p className="text-gray-600 mt-1 leading-relaxed">{child.medical_history}</p>
                    </div>
                  )}
                  
                  {child.allergies && (
                    <div className="mt-3 pt-3 border-t">
                      <strong>Dị ứng:</strong>
                      <p className="text-gray-600 mt-1 leading-relaxed">{child.allergies}</p>
                    </div>
                  )}
                  
                  {child.vaccination_record && (
                    <div className="mt-3 pt-3 border-t">
                      <strong>Lịch sử tiêm chủng:</strong>
                      <p className="text-gray-600 mt-1 leading-relaxed">{child.vaccination_record}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileContent;
