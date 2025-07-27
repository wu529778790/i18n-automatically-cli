import i18n from '@/i18n';
interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

class UserService {
  private users: User[] = [];

  constructor() {
    this.initializeUsers();
  }

  private initializeUsers(): void {
    this.users = [
      {
        id: 1,
        name: i18n.global.t(i18n.global.t('key_key张三615db57a_f85994df')),
        email: 'zhangsan@example.com',
        role: 'admin',
      },
      {
        id: 2,
        name: i18n.global.t(i18n.global.t('key_key李四36c94235_509f7cab')),
        email: 'lisi@example.com',
        role: 'user',
      },
      {
        id: 3,
        name: i18n.global.t(i18n.global.t('key_key王五3228f322_57b50a63')),
        email: 'wangwu@example.com',
        role: 'guest',
      },
    ];
  }

  public async createUser(
    userData: Omit<User, 'id'>
  ): Promise<ApiResponse<User>> {
    try {
      const newUser: User = {
        id: this.users.length + 1,
        ...userData,
      };

      this.users.push(newUser);

      return {
        success: true,
        message: i18n.global.t(
          i18n.global.t('key_key用户创建成功a7499d82_712194a4')
        ),
        data: newUser,
      };
    } catch (error) {
      return {
        success: false,
        message: i18n.global.t(
          i18n.global.t('key_key用户创建失败请重试27c3667a_1ee9f175')
        ),
      };
    }
  }

  public async getUserById(id: number): Promise<ApiResponse<User>> {
    const user = this.users.find((u) => u.id === id);

    if (!user) {
      return {
        success: false,
        message: i18n.global.t(
          i18n.global.t('key_key用户不存在489251bf_406ba488')
        ),
      };
    }

    return {
      success: true,
      message: i18n.global.t(
        i18n.global.t('key_key获取用户信息成功b92ac75a_e12ca906')
      ),
      data: user,
    };
  }

  public async updateUser(
    id: number,
    updates: Partial<Omit<User, 'id'>>
  ): Promise<ApiResponse<User>> {
    const userIndex = this.users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return {
        success: false,
        message: i18n.global.t(
          i18n.global.t('key_key找不到指定用户9faec22e_a20c7d21')
        ),
      };
    }

    this.users[userIndex] = { ...this.users[userIndex], ...updates };

    return {
      success: true,
      message: i18n.global.t(
        i18n.global.t('key_key用户信息更新成功c941d2d8_05ad9627')
      ),
      data: this.users[userIndex],
    };
  }

  public async deleteUser(id: number): Promise<ApiResponse<null>> {
    const userIndex = this.users.findIndex((u) => u.id === id);

    if (userIndex === -1) {
      return {
        success: false,
        message: i18n.global.t(
          i18n.global.t('key_key用户不存在删除失败27a03773_3e99ae36')
        ),
      };
    }

    this.users.splice(userIndex, 1);

    return {
      success: true,
      message: i18n.global.t(
        i18n.global.t('key_key用户删除成功9b86e725_7f6d3f02')
      ),
    };
  }

  public validateUserRole(user: User, requiredRole: User['role']): boolean {
    const roleHierarchy = {
      guest: 0,
      user: 1,
      admin: 2,
    };

    if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
      throw new Error(
        i18n.global.t(
          i18n.global.t('key_key权限不足无法执行此操作ac1548_12aad733')
        )
      );
    }

    return true;
  }
}

export { User, ApiResponse, UserService };
